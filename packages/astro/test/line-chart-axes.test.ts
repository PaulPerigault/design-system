import type { Dataset } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import LineChart from '../src/data/LineChart.astro';
import { markerPath } from '../src/data/chart/markers';
import { daily, simple, wave } from './chart-fixtures';
import { renderDom } from './render';

const render = (dataset: Dataset): Promise<Document> =>
  renderDom(LineChart, { props: { id: 'axes', title: 'Axes', dataset } });
const ticks = (document: Document, axis: string): string[] =>
  [...document.querySelectorAll(`text[data-axis="${axis}"]`)].map((t) => t.textContent ?? '');

describe('LineChart (axes et marqueurs)', () => {
  it('axe de catégories : points régulièrement espacés, libellés espacés au plus 5', async () => {
    const labels = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    const dataset: Dataset = {
      schema: 1,
      x: { kind: 'category', label: 'Trimestre', values: labels },
      series: [{ id: 'a', label: 'A', unit: '€', values: labels.map((_, i) => i * 10) }],
    };
    const document = await render(dataset);
    expect(ticks(document, 'x')).toEqual(['T1', 'T4', 'T7', 'T10']);
    expect(ticks(document, 'y')[0]).toBe('0');
    expect(document.querySelector('desc')?.textContent).not.toContain('ne part pas de zéro');
  });

  it('axe numérique : graduations rondes, formatage fr des milliers', async () => {
    const dataset: Dataset = {
      schema: 1,
      x: { kind: 'number', label: 'Prix', values: [0, 1000, 2000, 3000] },
      series: [{ id: 'a', label: 'A', unit: '', values: [1500, 2500, 3500, 4500] }],
    };
    const document = await render(dataset);
    expect(ticks(document, 'x')).toEqual(['0', '1 000', '2 000', '3 000']);
    expect(document.querySelector('text[data-axis="unit"]')).toBeNull();
  });

  it('axe temporel sur deux ans : libellés par année', async () => {
    const dataset: Dataset = {
      schema: 1,
      x: {
        kind: 'time',
        label: 'Mois',
        values: ['2024-01', '2024-07', '2025-01', '2025-07', '2026-01'],
      },
      series: [{ id: 'a', label: 'A', unit: '', values: [1, 2, 3, 4, 5] }],
    };
    expect(ticks(await render(dataset), 'x')).toEqual([
      'janv. 2024',
      'juil. 2024',
      'janv. 2025',
      'juil. 2025',
      'janv. 2026',
    ]);
  });

  it('un point isolé garde un marqueur : il ne dessine aucun trait', async () => {
    const dataset: Dataset = {
      schema: 1,
      x: { kind: 'category', label: 'Mois', values: ['a', 'b', 'c'] },
      series: [{ id: 's', label: 'S', unit: '', values: [null, 5, null] }],
    };
    const document = await render(dataset);
    expect(document.querySelector('.pp-line-chart__line')?.getAttribute('d')).toBe('');
    expect(document.querySelector('.pp-line-chart__marker')?.getAttribute('d')).toMatch(/^M\d/);
  });

  it('marque tous les points sous 24, seulement le dernier au-delà', async () => {
    const short = await render(daily(10, [{ id: 'a', label: 'A', values: wave(10, 100, 1) }]));
    expect(
      short.querySelector('.pp-line-chart__marker')?.getAttribute('d')?.match(/M/g),
    ).toHaveLength(10);
    const long = await render(simple());
    expect(
      long.querySelector('.pp-line-chart__marker')?.getAttribute('d')?.match(/M/g),
    ).toHaveLength(1);
  });

  it('six formes de marqueur distinctes, la septième reprend la première', () => {
    const shapes = Array.from({ length: 6 }, (_, i) => markerPath(i, 10, 10).slice(5));
    expect(new Set(shapes).size).toBe(6);
    expect(markerPath(6, 10, 10)).toBe(markerPath(0, 10, 10));
  });
});
