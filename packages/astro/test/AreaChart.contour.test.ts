import { describe, expect, it } from 'vitest';
import AreaChart from '../src/data/AreaChart.astro';
import { layer, pointCount } from './area-dom';
import { areasWithGaps } from './area-fixtures';
import { triple } from './chart-fixtures';
import { renderDom } from './render';

const render = (dataset: unknown): Promise<Document> =>
  renderDom(AreaChart, { props: { id: 'visites', title: 'Visites par pays', dataset } });

describe('AreaChart (fond et contour)', () => {
  it('peint un fond par couche sous les contours, de l’arrière vers l’avant', async () => {
    const document = await render(triple());
    expect(document.querySelectorAll('use, defs > path')).toHaveLength(0);
    const paths = [...document.querySelectorAll('figure > svg > g[data-series] > path')];
    expect(
      paths.map(
        (p) => `${p.parentElement?.getAttribute('data-series')}:${p.getAttribute('class')}`,
      ),
    ).toEqual([
      '3:pp-area-chart__area',
      '2:pp-area-chart__area',
      '1:pp-area-chart__area',
      '1:pp-area-chart__line',
      '2:pp-area-chart__line',
      '3:pp-area-chart__line',
    ]);
    expect(paths[0]?.getAttribute('fill')).toBe('url(#visites-p3)');
  });

  it('limite le contour à la courbe supérieure : ni base, ni côtés, ni fermeture', async () => {
    const document = await render(areasWithGaps());
    for (const rank of [1, 2]) {
      const top = layer(document, rank, 'line');
      expect(top).toMatch(/^M/);
      expect(top).not.toMatch(/[VHvhzZ]/);
      expect(layer(document, rank, 'area')).toMatch(/V[\d.]+H[\d.]+z/);
      expect(pointCount(top)).toBeGreaterThan(1);
    }
    expect((layer(document, 2, 'line').match(/M/g) ?? []).length).toBe(
      (layer(document, 2, 'area').match(/M/g) ?? []).length,
    );
  });
});
