import { describe, expect, it } from 'vitest';
import { ChartError } from '../src/data/chart/errors';
import Legend from '../src/data/Legend.astro';
import { renderComponent, renderDom } from './render';

const ITEMS = ['Recherche', 'Direct', 'Référents'];
const render = (props: Record<string, unknown>): Promise<Document> =>
  renderDom(Legend, { props: { id: 'leg', items: ITEMS, ...props } });
const codeOf = async (props: Record<string, unknown>): Promise<string | undefined> => {
  const error = await render(props).catch((e: unknown) => e);
  return error instanceof ChartError ? error.code : undefined;
};
const outline = (d: string | null | undefined): string => (d ?? '').replace(/^M\S+ \S+/, '');

describe('Legend', () => {
  it('rend une liste nommée : un échantillon, un marqueur et un libellé par entrée', async () => {
    const document = await render({});
    const list = document.querySelector('ul.pp-legend');
    expect(list?.getAttribute('role')).toBe('list');
    expect(list?.getAttribute('aria-label')).toBe('Légende');
    const items = [...document.querySelectorAll('li')];
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual(ITEMS);
    const ranks = items.map((li) => li.querySelector('svg')?.getAttribute('data-series'));
    expect(ranks).toEqual(['1', '2', '3']);
    // Le rang porte aussi une forme : trois marqueurs de formes différentes.
    const shapes = items.map((li) => li.querySelector('.pp-legend__marker')?.getAttribute('d'));
    expect(new Set(shapes.map(outline)).size).toBe(3);
    const hidden = items.map((li) => li.querySelector('svg')?.getAttribute('aria-hidden'));
    expect(hidden).toEqual(['true', 'true', 'true']);
  });

  it('en barres : un motif de remplissage par rang, ids propres à la légende', async () => {
    const document = await render({ kind: 'bar' });
    expect(document.querySelectorAll('pattern')).toHaveLength(3);
    const bars = [...document.querySelectorAll('.pp-legend__bar')];
    expect(bars.map((p) => p.getAttribute('fill'))).toEqual([
      'url(#leg-p1)',
      'url(#leg-p2)',
      'url(#leg-p3)',
    ]);
    expect(document.querySelector('#leg-p2')).not.toBeNull();
  });

  it('accepte un nom accessible, et une entrée seule', async () => {
    const document = await render({ items: ['Visites'], label: 'Séries du graphique' });
    expect(document.querySelector('ul')?.getAttribute('aria-label')).toBe('Séries du graphique');
    expect(document.querySelectorAll('li')).toHaveLength(1);
  });

  it.each([
    ['dataset.bad-shape', { items: [] }],
    ['dataset.bad-shape', { items: ['a', ' '] }],
    ['chart.too-many-series', { items: ['1', '2', '3', '4', '5', '6', '7'] }],
  ])('échoue au build avec le code %s', async (code, props) => {
    expect(await codeOf(props)).toBe(code);
  });

  it('refuse un id invalide', async () => {
    await expect(render({ id: 'a b' })).rejects.toThrow(/Legend : id attendu/);
  });

  it('n’écrit aucun attribut style ni couleur brute, et tient à jour le rendu d’essai', async () => {
    const html = await renderComponent(Legend, { props: { id: 'leg', items: ITEMS } });
    const clean = html.replace(/&#\d+;|url\(#[\w-]+\)/g, ' ');
    expect(clean).not.toMatch(/\sstyle=|#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
    await expect(html).toMatchFileSnapshot('./fixtures/legend.html');
  });
});
