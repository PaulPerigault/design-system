import { describe, expect, it } from 'vitest';
import { analyze, RULE_IDS } from '../src/design/rules.mjs';

const ALL = new Set(RULE_IDS);
const rulesOf = (file, text) => analyze(file, text, ALL).map((p) => p.rule);
const css = (text) => rulesOf('a.css', text);
const markup = (text) => rulesOf('a.astro', text);

describe('propriétés logiques de couleur', () => {
  it('refuse une couleur nommée sur border-inline-start et outline-offset-like', () => {
    expect(css('a { border-inline-start: 1px solid red; }')).toEqual(['color-literal']);
    expect(css('a { outline-style-x: red; }')).toEqual(['color-literal']);
  });
  it('permet les variantes logiques avec un token', () => {
    expect(css('a { border-block-end-color: var(--pp-color-fg); }')).toEqual([]);
    expect(css('a { border-inline-start: 1px solid var(--pp-color-fg); }')).toEqual([]);
  });
});

describe('jetons de classe avec crochets', () => {
  it('ne coupe pas les virgules dans les crochets', () => {
    expect(markup('<p class="bg-[rgba(0,0,0,0.5)]">')).toEqual(['arbitrary-value']);
    expect(markup('<p class="grid-cols-[1fr,2fr]">')).toEqual(['arbitrary-value']);
  });
  it('sépare toujours les éléments de class:list hors crochets', () => {
    expect(markup('<p class:list={["p-4", cond && "shadow-md"]}>')).toEqual(['shadow']);
  });
  it('ignore data-class et les attributs au nom composé', () => {
    expect(markup('<p data-class="shadow-md">')).toEqual([]);
    expect(markup('<p class="p-4">')).toEqual([]);
  });
});

describe('valeurs arbitraires Tailwind v4 avec parenthèses', () => {
  it('refuse une variable hors tokens', () => {
    expect(markup('<p class="p-(--x) bg-(--brand)">')).toEqual(Array(2).fill('arbitrary-value'));
    expect(markup('<p class="bg-(color:--brand)">')).toEqual(['arbitrary-value']);
  });
  it('permet un token --pp-*', () => {
    expect(markup('<p class="p-(--pp-space-m) bg-(--pp-color-bg)">')).toEqual([]);
  });
});

describe('numéros de ligne hors .css', () => {
  it('compte frontmatter, attribut et <style>', () => {
    const text = [
      '---',
      'const a = 1;',
      '---',
      '<p',
      '  class="shadow-md">',
      'x</p>',
      '<style>',
      'a {',
      '  color: #fff;',
      '}',
      '</style>',
    ].join('\n');
    const lines = analyze('a.astro', text, ALL).map((p) => p.line);
    expect(lines).toEqual([5, 9]);
  });
});

describe('commentaires HTML', () => {
  const text = '<!-- shadow-md 🎉 <p class="shadow-md"> -->';
  it('sont neutralisés dans .astro et .md', () => {
    expect(rulesOf('a.astro', text)).toEqual([]);
    expect(rulesOf('a.md', text)).toEqual([]);
  });
});

describe('portée par extension', () => {
  it('ne lit ni CSS ni classes dans un .md', () => {
    expect(rulesOf('a.md', 'color: #fff; <p class="shadow-md">')).toEqual([]);
  });
  it('ne lit pas du texte hors <style> comme du CSS dans un .astro', () => {
    expect(markup('<p>color: red;</p>')).toEqual([]);
  });
});

describe('couleur nommée hors propriété de couleur', () => {
  it('permet grid-area et animation-name', () => {
    expect(css('a { grid-area: red; animation-name: tan; }')).toEqual([]);
  });
});
