import type { Dataset } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import LineChart from '../src/data/LineChart.astro';
import { ChartError } from '../src/data/chart/errors';
import { daily, simple } from './chart-fixtures';
import { renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par jour' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(LineChart, { props: { ...BASE, dataset, ...props } });

describe('LineChart (états)', () => {
  it('affiche un état vide quand aucune valeur n’est présente, tableau conservé', async () => {
    const empty = daily(3, [{ id: 'a', label: 'A', values: [null, null, null] }]);
    const document = await render(empty);
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Aucune donnée à afficher.',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it.each([
    ['dataset.length-mismatch', daily(3, [{ id: 'a', label: 'A', values: [1, 2] }])],
    [
      'dataset.unit-mismatch',
      daily(2, [
        { id: 'a', label: 'A', unit: '€', values: [1, 2] },
        { id: 'b', label: 'B', unit: '%', values: [1, 2] },
      ]),
    ],
    ['dataset.bad-shape', { schema: 2 }],
  ])('lève une ChartError portant le code %s', async (code, dataset) => {
    const failure = await render(dataset).catch((error: unknown) => error);
    expect(String(failure)).toContain(`[${code}]`);
    expect(String(failure)).toContain('LineChart « Visites par jour »');
  });

  it('expose le code sur une ChartError', () => {
    const error = new ChartError('x', { code: 'dataset.empty', message: 'm', path: 'series' });
    expect([error.code, error.path, error.message]).toEqual([
      'dataset.empty',
      'series',
      'x : [dataset.empty] m (series)',
    ]);
  });

  it('refuse un id invalide', async () => {
    await expect(render(simple(), { id: '1 a' })).rejects.toThrow(/id attendu/);
  });

  it('tombe en repli (alerte et tableau) quand les abscisses ne croissent pas', async () => {
    const reversed: Dataset = {
      schema: 1,
      x: { kind: 'time', label: 'Jour', values: ['2026-01-03', '2026-01-02', '2026-01-01'] },
      series: [{ id: 'a', label: 'A', unit: '', values: [1, 2, 3] }],
    };
    const document = await render(reversed);
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[data-state="error"]')?.textContent).toContain(
      'geometry.bad-input',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
  });
});
