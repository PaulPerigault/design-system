import type { Dataset } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { ChartError } from '../src/data/chart/errors';
import { barsLarge, barsSimple } from './chart-fixtures';
import { renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par pays' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(BarChart, { props: { ...BASE, dataset, ...props } });

const MAX_CATEGORIES = 40;
const column = (dataset: Dataset, values: (number | null)[]): Dataset => ({
  ...dataset,
  series: [{ id: 'a', label: 'A', unit: '', values }],
});

describe('BarChart (états)', () => {
  it('affiche un état vide quand aucune valeur n’est présente, tableau conservé', async () => {
    const document = await render(column(barsSimple(), [null, null, null, null, null]));
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Aucune donnée à afficher.',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('dessine une barre nulle sans erreur et écrit sa valeur au-dessus de la base', async () => {
    const document = await render(column(barsSimple(), [0, 0, 0, 0, 0]), { showValues: true });
    expect(document.querySelectorAll('.pp-bar-chart__value')).toHaveLength(5);
    expect(document.querySelector('.pp-bar-chart__state')).toBeNull();
  });

  it.each([
    ['dataset.length-mismatch', column(barsSimple(), [1, 2])],
    ['dataset.non-finite', column(barsSimple(), [1, 2, Number.NaN, 4, 5])],
  ])('échoue au build avec le code %s', async (code, dataset) => {
    const error = await render(dataset).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ChartError);
    expect((error as ChartError).code).toBe(code);
  });

  it('échoue avec bar.too-many-categories au-delà de 40 catégories, avec le conseil', async () => {
    const error = await render(barsLarge(MAX_CATEGORIES + 1, 1)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ChartError);
    expect((error as ChartError).code).toBe('bar.too-many-categories');
    expect((error as ChartError).message).toContain('[bar.too-many-categories]');
    expect((error as ChartError).message).toContain('courbe');
    expect((error as ChartError).message).toContain('agrégez');
    expect((await render(barsLarge(MAX_CATEGORIES, 1))).querySelector('svg')).not.toBeNull();
  });

  it('échoue avec chart.too-many-series au-delà de 6 séries', async () => {
    const error = await render(barsLarge(3, 7)).catch((e: unknown) => e);
    expect((error as ChartError).code).toBe('chart.too-many-series');
  });

  it.each(['', 'a b', '1abc', 42])('refuse l’id %j', async (id) => {
    await expect(render(barsSimple(), { id })).rejects.toThrow(/BarChart : id attendu/);
  });

  it('reprend les libellés fournis', async () => {
    const document = await render(barsSimple(), { tableLabel: 'Chiffres' });
    expect(document.querySelector('summary')?.textContent).toBe('Chiffres');
  });
});
