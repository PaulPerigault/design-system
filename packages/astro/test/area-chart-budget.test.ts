import { describe, expect, it } from 'vitest';
import AreaChart from '../src/data/AreaChart.astro';
import { areasLarge } from './area-fixtures';
import { renderDom } from './render';

const MAX_BYTES = 10_000;
const MAX_NODES = 400;
const MAX_POINTS = 500;

const svgOf = async (dataset: unknown): Promise<Element> => {
  const document = await renderDom(AreaChart, {
    props: { id: 'budget', title: 'Budget', dataset },
  });
  const svg = document.querySelector('figure > svg');
  if (!svg) throw new Error('svg absent');
  return svg;
};

describe('AreaChart (budgets, ADR-0007)', () => {
  it.each([1, 2, 3, 4, 6])(
    '%i série(s) de 500 points : au plus 10 ko et 400 nœuds',
    async (series) => {
      const svg = await svgOf(areasLarge(MAX_POINTS, series));
      expect(Buffer.byteLength(svg.outerHTML)).toBeLessThanOrEqual(MAX_BYTES);
      expect(svg.querySelectorAll('*').length + 1).toBeLessThanOrEqual(MAX_NODES);
    },
  );
});
