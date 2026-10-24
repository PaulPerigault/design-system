import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Diagram from '../src/media/Diagram.astro';
import { renderComponent, renderDom } from './render';

const BASE = {
  id: 'chaine',
  title: 'Chaîne de dépendances',
  description: 'Les jetons alimentent css, qui alimente astro.',
  viewBox: '0 0 360 120',
};
const SLOT = '<rect class="pp-diagram__box" x="8" y="40" width="96" height="40"></rect>';
const css = readFileSync(new URL('../src/media/diagram.css', import.meta.url), 'utf8');
const tokensCss = readFileSync(
  new URL('../../tokens/generated/tokens.css', import.meta.url),
  'utf8',
);

const render = (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Diagram, { props: { ...BASE, ...props }, slot: SLOT });

describe('Diagram (rendu)', () => {
  it('rend une figure, un cadre et un SVG role img nommé par titre puis description', async () => {
    const document = await render({ class: 'placement' });
    const svg = document.querySelector('figure.pp-diagram.placement .pp-diagram__frame > svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('chaine-t chaine-d');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 360 120');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelector('rect.pp-diagram__box')).not.toBeNull();
  });

  it('porte le titre et la description dans le SVG, la légende en figcaption', async () => {
    const document = await render({ caption: 'Sens des flèches' });
    expect(document.querySelector('title#chaine-t')?.textContent).toBe(BASE.title);
    expect(document.querySelector('desc#chaine-d')?.textContent).toBe(BASE.description);
    expect(document.querySelector('figure > figcaption')?.textContent).toBe('Sens des flèches');
  });

  it('rend la légende seulement si elle est fournie', async () => {
    expect((await render()).querySelector('figcaption')).toBeNull();
  });
});

describe('Diagram (scroll)', () => {
  it('sans scroll : aucun point d’arrêt, aucun rôle de groupe, aucune largeur fixe', async () => {
    const document = await render();
    const frame = document.querySelector('.pp-diagram__frame');
    expect(frame?.hasAttribute('tabindex')).toBe(false);
    expect(frame?.hasAttribute('role')).toBe(false);
    expect(document.querySelector('svg')?.hasAttribute('width')).toBe(false);
  });

  it('avec scroll : conteneur focalisable nommé par le titre, SVG à la largeur du viewBox', async () => {
    const document = await render({ scroll: true, viewBox: '-10 0 480 120' });
    const frame = document.querySelector('.pp-diagram__frame');
    expect(frame?.getAttribute('tabindex')).toBe('0');
    expect(frame?.getAttribute('role')).toBe('group');
    expect(frame?.getAttribute('aria-labelledby')).toBe('chaine-t');
    expect(document.querySelector('svg')?.getAttribute('width')).toBe('480');
  });
});

describe('Diagram (cas limites)', () => {
  it.each([
    { title: '   ' },
    { description: '' },
    { id: '' },
    { id: 'deux mots' },
    { id: '1chaine' },
    { viewBox: '0 0 360' },
    { viewBox: '0 0 wide 120' },
  ])('refuse %j', async (props) => {
    await expect(renderComponent(Diagram, { props: { ...BASE, ...props } })).rejects.toThrow(
      /Diagram/,
    );
  });

  it('ne pose aucun attribut style, même avec toutes les options', async () => {
    const html = await renderComponent(Diagram, {
      props: { ...BASE, caption: 'x', scroll: true },
      slot: SLOT,
    });
    expect(html).not.toMatch(/\sstyle=/);
  });
});

describe('Diagram (feuille de style)', () => {
  const tokens = new Set([...tokensCss.matchAll(/(--pp-[\w-]+):/g)].map((m) => m[1]));

  it('n’utilise que des jetons définis dans tokens.css', () => {
    const used = [...css.matchAll(/var\((--pp-[\w-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !tokens.has(name))).toEqual([]);
  });

  it.each(['__line', '__head', '__box', '__accent', '__label'])('définit pp-diagram%s', (name) => {
    expect(css).toContain(`.pp-diagram${name}`);
  });

  it('pose le défilement logique et les couleurs système sous forced-colors', () => {
    expect(css).toMatch(/\[data-scroll\]\s*\{\s*overflow-inline: auto;/);
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*stroke: CanvasText;/);
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*fill: Canvas;/);
  });

  it('ne contient ni dégradé, ni ombre, ni flou', () => {
    expect(css).not.toMatch(/gradient|box-shadow|drop-shadow|backdrop-filter|blur\(/);
  });
});
