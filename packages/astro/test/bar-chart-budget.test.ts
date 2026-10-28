import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { barsLarge } from './chart-fixtures';
import { renderDom } from './render';

const MAX_BYTES = 10_000;
const MAX_NODES = 400;
const MAX_CATEGORIES = 40;

const svgOf = async (dataset: unknown, props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(BarChart, {
    props: { id: 'budget', title: 'Budget', dataset, ...props },
  });
  const svg = document.querySelector('figure > svg');
  if (!svg) throw new Error('svg absent');
  return svg;
};

describe('BarChart (budgets, ADR-0007)', () => {
  const orientations = ['vertical', 'horizontal'] as const;
  // Jeux réalistes : au plus 120 barres (40 catégories × 3 séries, ou 20 × 6).
  const shapes = [
    [40, 1],
    [40, 3],
    [20, 6],
    [12, 6],
  ] as const;

  it.each(orientations.flatMap((o) => shapes.map(([c, s]) => [o, c, s] as const)))(
    '%s, %i catégories, %i série(s), valeurs demandées : au plus 10 ko et 400 nœuds',
    async (orientation, categories, series) => {
      const svg = await svgOf(barsLarge(categories, series), { orientation, showValues: true });
      expect(Buffer.byteLength(svg.outerHTML)).toBeLessThanOrEqual(MAX_BYTES);
      expect(svg.querySelectorAll('*').length + 1).toBeLessThanOrEqual(MAX_NODES);
    },
  );

  it('tient en 400 nœuds même au pire (40 catégories, 6 séries, 240 barres)', async () => {
    const svg = await svgOf(barsLarge(MAX_CATEGORIES, 6));
    expect(svg.querySelectorAll('*').length + 1).toBeLessThanOrEqual(MAX_NODES);
  });

  it('dessine une barre par valeur, regroupées en un chemin par série', async () => {
    const svg = await svgOf(barsLarge(12, 3));
    const paths = [...svg.querySelectorAll('path.pp-bar-chart__bar')];
    expect(paths).toHaveLength(3);
    for (const path of paths) expect((path.getAttribute('d') ?? '').match(/M/g)).toHaveLength(12);
  });
});
