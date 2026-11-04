import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/lib/glossary.ts';
import { linkTerms, term } from '../../../tools/typography/term-links.mjs';
import { TERMS, run } from './link-terms.mjs';

const link = (id, text) => `<a href="/glossaire/#${id}">${text}</a>`;

describe('termes du glossaire', () => {
  it('chaque terme lié existe au glossaire', () => {
    const ids = new Set(GLOSSARY.map((entry) => entry.id));
    expect(TERMS.filter((entry) => !ids.has(entry.id))).toEqual([]);
  });
});

describe('linkTerms', () => {
  const terms = [term('ci', ['CI']), term('build', ['build', 'builds'])];
  it('lie seulement la première occurrence de chaque terme', () => {
    const html = '<p>La CI lance le build. La CI relance le build.</p>';
    expect(linkTerms(html, terms)).toBe(
      `<p>La ${link('ci', 'CI')} lance le ${link('build', 'build')}. La CI relance le build.</p>`,
    );
  });
  it('ne touche ni le code, ni un titre, ni un lien existant', () => {
    const html = '<h2>Le build</h2><code>CI</code><a href="/x">CI</a><p>puis build</p>';
    expect(linkTerms(html, terms)).toBe(
      `<h2>Le build</h2><code>CI</code><a href="/x">CI</a><p>puis ${link('build', 'build')}</p>`,
    );
  });
  it('ne touche pas le <title> du document, texte brut sans balisage', () => {
    const html = '<head><title>Jamais en CI · Design system</title></head><p>la CI</p>';
    expect(linkTerms(html, terms)).toBe(
      `<head><title>Jamais en CI · Design system</title></head><p>la ${link('ci', 'CI')}</p>`,
    );
  });
  it('ne coupe pas un mot ni un identifiant composé', () => {
    const html = '<p>CIBLE build-data rebuild CI.</p>';
    expect(linkTerms(html, terms)).toBe(`<p>CIBLE build-data rebuild ${link('ci', 'CI')}.</p>`);
  });
  it('est idempotent', () => {
    const once = linkTerms('<p>la CI</p>', terms);
    expect(linkTerms(once, terms)).toBe(once);
  });
});

describe('run', () => {
  it('saute le glossaire lui-même et les pages Pagefind', () => {
    const files = { 'a/index.html': '<p>la CI</p>', 'glossaire/index.html': '<p>la CI</p>' };
    const io = {
      dist: 'dist',
      list: () => [...Object.keys(files), 'pagefind/p.html'],
      read: (path) => files[path.replace(/^dist\//, '')],
      write: (path, text) => {
        files[path.replace(/^dist\//, '')] = text;
      },
      out: { write: () => undefined },
    };
    expect(run(io)).toBe(1);
    expect(files['glossaire/index.html']).toBe('<p>la CI</p>');
  });
});
