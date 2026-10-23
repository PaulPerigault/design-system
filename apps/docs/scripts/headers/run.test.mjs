import { describe, expect, it } from 'vitest';
import { REQUIRED_HEADERS } from './policy.mjs';
import { run } from './run.mjs';

const DIST = '/site/dist';
const page = (style, script, extra = '') =>
  `<html><head><style>${style}</style></head><body>${extra}<script>${script}</script></body></html>`;

/** FS en mémoire ; `tamper` modifie le texte d'un fichier à l'écriture. */
function memoryFs(pages, tamper = (_path, text) => text) {
  const files = new Map(Object.entries(pages));
  return {
    files,
    list: (dir) =>
      [...files.keys()].filter((p) => p.startsWith(dir)).map((p) => p.slice(dir.length + 1)),
    read: (path) => {
      if (!files.has(path)) throw new Error(`absent : ${path}`);
      return files.get(path);
    },
    write: (path, text) => files.set(path, tamper(path, text)),
  };
}

const pages = {
  [`${DIST}/index.html`]: page('a{}', 'x()'),
  [`${DIST}/b/index.html`]: page('b{}', 'x()'),
};

describe('run', () => {
  it('écrit les cinq sorties, deploy hors de dist par défaut', () => {
    const io = memoryFs(pages);
    const written = run({ dist: DIST, ...io });
    expect(written.sort()).toEqual(
      [
        '/site/dist/_headers',
        '/site/dist/_redirects',
        '/site/deploy/netlify.toml',
        '/site/deploy/nginx.conf',
        '/site/deploy/vercel.json',
      ].sort(),
    );
    for (const path of written) expect(io.files.has(path)).toBe(true);
  });

  it('respecte le dossier deploy fourni', () => {
    const io = memoryFs(pages);
    const written = run({ dist: DIST, deploy: '/out', ...io });
    expect(written).toContain('/out/nginx.conf');
  });

  it('fait l’union triée des hachages de toutes les pages', () => {
    const io = memoryFs(pages);
    run({ dist: DIST, ...io });
    const csp = io.files.get(`${DIST}/_headers`).match(/Content-Security-Policy: (.*)/)[1];
    const styleSrc = csp.split('; ').find((d) => d.startsWith('style-src'));
    const hashes = styleSrc.match(/'sha256-[^']+'/g);
    expect(hashes).toHaveLength(2);
    expect(hashes).toEqual([...hashes].sort());
    expect(
      csp
        .split('; ')
        .find((d) => d.startsWith('script-src'))
        .match(/sha256/g),
    ).toHaveLength(1);
  });

  it('refuse un attribut style en ligne, en nommant le fichier', () => {
    const bad = { ...pages, [`${DIST}/c/index.html`]: page('', '', '<p style="color:red">x</p>') };
    expect(() => run({ dist: DIST, ...memoryFs(bad) })).toThrow(/c\/index\.html.*style=""/);
  });

  it('détecte un en-tête obligatoire manquant', () => {
    const [missing] = REQUIRED_HEADERS.slice(-1);
    const strip = (path, text) =>
      path.endsWith('nginx.conf') ? text.replaceAll(missing, 'X-Removed') : text;
    expect(() => run({ dist: DIST, ...memoryFs(pages, strip) })).toThrow(
      new RegExp(`nginx\\.conf.*${missing}`),
    );
  });
});
