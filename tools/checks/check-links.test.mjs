import { describe, expect, it } from 'vitest';
import { checkInternal, externalUrls } from './check-links.mjs';
import { distinctExternal, measureExternal } from '../links/external.mjs';
import { extractIds, extractLinks } from '../links/html-refs.mjs';
import { classify, normalize, servedFile } from '../links/resolve.mjs';
import { externalReport, internalReport } from '../links/report.mjs';

const FILES = {
  'index.html': '<a href="/guide/">Guide</a><a href="/guide/#etape">Étape</a><a id="haut"></a>',
  'guide/index.html': '<h2 id="etape">E</h2><a href="../">Accueil</a><a href="#etape">ici</a>',
  'a.html': '<a href="/guide/#absent">x</a><a href="/nulle-part/">y</a><a href="/style.css">c</a>',
  'style.css': '',
};
const site = (extra = {}) => {
  const files = { ...FILES, ...extra };
  return {
    pages: Object.entries(files)
      .filter(([name]) => name.endsWith('.html'))
      .map(([page, html]) => ({ page, html })),
    exists: (file) => file in files,
    read: (file) => files[file],
  };
};
const settings = { origins: ['https://ex.test'], exceptions: [], ignoredHosts: ['refuse.test'] };

describe('extraction', () => {
  it('lit href, src et les identifiants', () => {
    const html = '<a href="/x?a=1&amp;b=2">x</a><img src=/i.png><h2 id=t>T</h2><meta name="d">';
    expect(extractLinks(html)).toEqual([
      { tag: 'a', url: '/x?a=1&b=2' },
      { tag: 'img', url: '/i.png' },
    ]);
    expect([...extractIds(html)]).toEqual(['t', 'd']);
  });
  it('ignore une balise sans lien', () => {
    expect(extractLinks('<a name="ancre">x</a><link rel="x" href="">')).toEqual([]);
  });
});

describe('résolution', () => {
  it('classe interne, externe, origine propre et schémas ignorés', () => {
    expect(classify('mailto:a@b.test', 'index.html').kind).toBe('skip');
    expect(classify('https://autre.test/x', 'index.html').kind).toBe('external');
    expect(classify('https://ex.test/guide/#e', 'index.html', ['https://ex.test'])).toEqual({
      kind: 'internal',
      path: 'guide/',
      hash: 'e',
    });
    expect(classify('../x/', 'a/b/index.html')).toEqual({
      kind: 'internal',
      path: 'a/x/',
      hash: '',
    });
  });
  it('normalise et sert comme un hébergeur statique', () => {
    expect(normalize('/a/./b/../c/')).toBe('a/c/');
    const exists = (file) => ['a/index.html', 'b.html'].includes(file);
    expect(servedFile('a/', exists)).toBe('a/index.html');
    expect(servedFile('b', exists)).toBe('b.html');
    expect(servedFile('c', exists)).toBeUndefined();
  });
});

describe('liens internes', () => {
  it('trouve un fichier et une ancre manquants, accepte le reste', () => {
    const problems = checkInternal(site(), settings);
    expect(problems).toEqual([
      { page: 'a.html', url: '/guide/#absent', problem: 'ancre' },
      { page: 'a.html', url: '/nulle-part/', problem: 'fichier' },
    ]);
  });
  it('respecte une exception datée', () => {
    const withException = { ...settings, exceptions: [{ url: '/nulle-part/' }] };
    expect(checkInternal(site(), withException)).toHaveLength(1);
  });
});

describe('liens externes', () => {
  it('dédoublonne, retire les ancres et les hôtes ignorés', () => {
    const urls = ['https://a.test/x#1', 'https://a.test/x#2', 'https://refuse.test/y', '/local'];
    expect(distinctExternal(urls, ['refuse.test'])).toEqual(['https://a.test/x']);
    const pages = site({ 'ext.html': '<a href="https://z.test/p">z</a>' });
    expect(externalUrls(pages, settings)).toEqual(['https://z.test/p']);
  });
  it('mesure sans jamais échouer ni dépasser le délai demandé', async () => {
    const waits = [];
    const statuses = { 'https://a.test/': 200, 'https://b.test/': 403 };
    const results = await measureExternal(
      ['https://a.test/', 'https://b.test/', 'https://c.test/'],
      {
        fetchStatus: async (url) => {
          if (!(url in statuses)) throw new Error('réseau');
          return statuses[url];
        },
        sleep: async (ms) => waits.push(ms),
      },
    );
    expect(results.map((r) => r.note)).toEqual(['ok', 'à vérifier', 'sans réponse (réseau)']);
    expect(waits).toEqual([700, 700]);
  });
});

describe('rapport', () => {
  it('dit 0 quand tout va bien et liste les défauts sinon', () => {
    expect(internalReport([], 3)).toEqual(['check-links : 3 pages, 0 lien(s) interne(s) cassé(s)']);
    expect(internalReport([{ page: 'a', url: '/x', problem: 'fichier' }], 3).join('\n')).toContain(
      '| a | `/x` | fichier |',
    );
    expect(externalReport([{ url: 'u', status: 404, note: 'à vérifier' }]).join('\n')).toContain(
      '404',
    );
  });
});
