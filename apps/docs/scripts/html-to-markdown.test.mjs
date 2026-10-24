import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from './html-to-markdown.mjs';
import { markdownName, run } from './markdown.mjs';

const BASE = 'https://design.paulperigault.dev';

describe('htmlToMarkdown', () => {
  it.each([
    [
      '<h1>Titre</h1><h2>Deux</h2><h3>Trois</h3><h4>Quatre</h4>',
      '# Titre\n\n## Deux\n\n### Trois\n\n#### Quatre',
    ],
    [
      '<p>Un <strong>gras</strong>, <em>italique</em> et <code>code</code>.</p>',
      'Un **gras**, *italique* et `code`.',
    ],
    ['<p>a</p><p>b</p>', 'a\n\nb'],
    [
      '<ul><li>un</li><li>deux<ol><li>x</li><li>y</li></ol></li></ul>',
      '- un\n- deux\n  1. x\n  2. y',
    ],
    ['<blockquote><p>Citation</p></blockquote>', '> Citation'],
    ['<dl><dt>Terme</dt><dd>Sens</dd></dl>', '**Terme**\n: Sens'],
    ['<img src="/a.png" alt="Logo"><img src="/b.png" alt="">', `![Logo](${BASE}/a.png)`],
    ['<p>&lt;b&gt; &amp; &#233; &#x41; &mdash; &inconnu;</p>', '<b> & é A — &inconnu;'],
  ])('convertit %s', (html, expected) => {
    expect(htmlToMarkdown(`<main>${html}</main>`)).toBe(expected);
  });

  it('absolutise les liens relatifs selon la page', () => {
    const html =
      '<a href="/x/">abs</a> <a href="../y">rel</a> <a href="#z">ancre</a> <a href="https://e.fr/">ext</a>';
    expect(htmlToMarkdown(html, { path: '/a/b/' })).toBe(
      `[abs](${BASE}/x/) [rel](${BASE}/a/y) [ancre](${BASE}/a/b/#z) [ext](https://e.fr/)`,
    );
  });

  it('écrit un tableau avec légende et en-têtes', () => {
    const html =
      '<table><caption>Jetons</caption><thead><tr><th>Nom</th><th>Valeur</th></tr></thead>' +
      '<tbody><tr><td>a|b</td><td>1</td></tr></tbody></table>';
    expect(htmlToMarkdown(html)).toBe('*Jetons*\n\n| Nom | Valeur |\n| --- | --- |\n| a\\|b | 1 |');
  });

  it('clôture les blocs de code et garde leur contenu', () => {
    const html = '<pre class="astro"><code class="language-css">a {\n\n\n  b: 1;\n}\n</code></pre>';
    expect(htmlToMarkdown(html)).toBe('```css\na {\n\n\n  b: 1;\n}\n```');
  });

  it('ignore les éléments non textuels', () => {
    const html =
      '<p>ok</p><script>x()</script><style>p{}</style><svg><title>s</title></svg><nav>n</nav>' +
      '<dialog>d</dialog><template>t</template><button>b</button><input value="i">' +
      '<p hidden>h</p><p aria-hidden="true">a</p>';
    expect(htmlToMarkdown(html)).toBe('ok');
  });

  it.each([
    '<p>a <strong>b',
    '<ul><li>a<li>b</ul></p></div>',
    '<a href="x',
    '<<>> & <!-- x',
    '<table><tr>',
  ])('ne lève pas d’erreur sur %s', (html) => {
    expect(() => htmlToMarkdown(html)).not.toThrow();
  });

  it('dégrade le HTML malformé en texte', () => {
    expect(htmlToMarkdown('<p>a <strong>b')).toBe('a **b**');
    expect(htmlToMarkdown('<ul><li>a<li>b</ul>')).toBe('- a\n- b');
  });
});

describe('run', () => {
  const page = (title, main) =>
    `<html><head><title>${title}</title></head><body><nav>menu</nav><main>${main}</main></body></html>`;

  it('écrit un .md par page et llms-full.txt', () => {
    const files = {
      'dist/index.html': page('Accueil', '<h1>Accueil</h1>'),
      'dist/components/button/index.html': page('Bouton', '<p>Texte</p>'),
      'dist/404.html': page('Perdu', '<p>x</p>'),
    };
    const written = {};
    const lines = [];
    const count = run({
      dist: 'dist',
      list: () => ['index.html', 'components', 'components/button/index.html', '404.html'],
      read: (path) => files[path],
      write: (path, text) => (written[path] = text),
      out: { write: (text) => lines.push(text) },
    });
    expect(count).toBe(2);
    expect(Object.keys(written).sort()).toEqual([
      'dist/components/button.md',
      'dist/index.md',
      'dist/llms-full.txt',
    ]);
    expect(written['dist/index.md']).toBe(`# Accueil\n\nSource : ${BASE}/\n\n# Accueil\n`);
    expect(written['dist/llms-full.txt']).toBe(
      `${written['dist/index.md'].trimEnd()}\n\n---\n\n${written['dist/components/button.md']}`,
    );
    expect(lines.join('')).toContain('2 pages');
  });

  it('nomme les jumeaux Markdown', () => {
    expect(markdownName('index.html')).toBe('index.md');
    expect(markdownName('a/b/index.html')).toBe('a/b.md');
  });
});
