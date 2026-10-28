import { describe, expect, it } from 'vitest';
import LineChart from '../src/data/LineChart.astro';
import { PLOT } from '../src/data/chart/frame';
import { daily, large, wave } from './chart-fixtures';
import { renderDom } from './render';

const MAX_BYTES = 10_000;
const MAX_NODES = 400;
const MAX_POINTS = 500;

const svgOf = async (dataset: unknown): Promise<Element> => {
  const document = await renderDom(LineChart, {
    props: { id: 'budget', title: 'Budget', dataset },
  });
  const svg = document.querySelector('figure > svg');
  if (!svg) throw new Error('svg absent');
  return svg;
};

const pointCount = (svg: Element): number[] =>
  [...svg.querySelectorAll('.pp-line-chart__line')].map(
    (path) => (path.getAttribute('d') ?? '').split(/[ML]/).length - 1,
  );

describe('LineChart (budgets, ADR-0007)', () => {
  it.each([1, 3, 6])('500 points sur %i série(s) : au plus 10 ko et 400 nœuds', async (count) => {
    const svg = await svgOf(large(count));
    expect(Buffer.byteLength(svg.outerHTML)).toBeLessThanOrEqual(MAX_BYTES);
    expect(svg.querySelectorAll('*').length + 1).toBeLessThanOrEqual(MAX_NODES);
  });

  it('garde les 500 points d’une série seule et partage le budget entre les séries', async () => {
    expect(pointCount(await svgOf(large(1)))).toEqual([MAX_POINTS]);
    expect(pointCount(await svgOf(large(3)))).toEqual([166, 166, 166]);
  });

  it('sous-échantillonne par LTTB au-delà de 500 points et garde premier et dernier points', async () => {
    const total = 2000;
    const dataset = daily(total, [{ id: 'a', label: 'A', unit: '€', values: wave(total, 100, 2) }]);
    const svg = await svgOf(dataset);
    const d = svg.querySelector('.pp-line-chart__line')?.getAttribute('d') ?? '';
    expect(pointCount(svg)).toEqual([MAX_POINTS]);
    expect(d.startsWith(`M${PLOT.left} `)).toBe(true);
    expect(d).toMatch(new RegExp(`L${PLOT.right} [\\d.]+$`));
    expect(Buffer.byteLength(svg.outerHTML)).toBeLessThanOrEqual(MAX_BYTES);
  });

  it('le tableau lié garde la donnée complète', async () => {
    const total = 600;
    const dataset = daily(total, [{ id: 'a', label: 'A', values: wave(total, 100, 2) }]);
    const document = await renderDom(LineChart, { props: { id: 'budget', title: 'B', dataset } });
    expect(document.querySelectorAll('tbody tr')).toHaveLength(total);
  });
});
