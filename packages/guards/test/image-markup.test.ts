import { describe, expect, it } from 'vitest';
import { neutralizeComments, rawImages } from '../src/application/images/markup.ts';

const labels = (text: string, ext: string) =>
  rawImages(neutralizeComments(text, ext), ext).map((f) => f.label);

describe('markup', () => {
  it('vise <img brut, insensible à la casse, pas <Image ni <Picture', () => {
    expect(labels('<img src="a">\n<IMG/>\n<img\n alt="">', '.astro')).toHaveLength(3);
    expect(labels('<Image src={a} /><Picture /><imgx>', '.tsx')).toEqual([]);
    expect(labels('<img src="a">', '.css')).toEqual([]);
  });

  it.each(['.astro', '.html', '.md', '.mdx', '.jsx', '.tsx'])('refuse <img dans %s', (ext) => {
    expect(labels('<img src="a">', ext)).toEqual(['<img> brut']);
  });

  it('vise background(-image): url( mais pas une police ni une variable', () => {
    const css = '.a { background-image: url(a.png); }\n.b { background: #000 url(b.png); }';
    expect(labels(css, '.css')).toEqual(['background-image: url(', 'background: url(']);
    const font = '@font-face { src: url(f.woff2); } .c { --pp-background: url(x); }';
    expect(labels(font, '.css')).toEqual([]);
    expect(labels('.d { background: red; mask: url(m.svg); }', '.css')).toEqual([]);
    expect(labels('<p style="background-image: url(a)">', '.html')).toEqual([]);
  });

  it('neutralise les commentaires sans décaler les lignes', () => {
    const text = '<style>/* <img>\n */</style> <!-- <img>\n -->\n<img>';
    expect(neutralizeComments(text, '.astro').split('\n')).toHaveLength(4);
    expect(rawImages(neutralizeComments(text, '.astro'), '.astro')).toEqual([
      { index: text.lastIndexOf('<img>'), label: '<img> brut' },
    ]);
  });

  it('neutralise /* */ dans un .css et un bloc <style>, pas dans une chaîne', () => {
    expect(labels('/* background: url(a) */ .a { color: red; }', '.css')).toEqual([]);
    expect(labels('<style>/* background: url(a) */</style>', '.astro')).toEqual([]);
    const frontmatter = "---\nconst p = '/src/*';\n---\n<img src={p}>";
    expect(labels(frontmatter, '.astro')).toEqual(['<img> brut']);
    expect(labels('/* <img> */<img>', '.html')).toEqual(['<img> brut', '<img> brut']);
  });

  it('neutralise {/* */} dans .jsx, .tsx et .mdx seulement', () => {
    for (const ext of ['.jsx', '.tsx', '.mdx']) {
      expect(labels('{/* <img> */}\n<img>', ext)).toEqual(['<img> brut']);
    }
    expect(labels('{/* <img> */}', '.astro')).toEqual(['<img> brut']);
  });
});
