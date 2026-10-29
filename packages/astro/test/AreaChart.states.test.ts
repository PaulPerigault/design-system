import type { Dataset } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import AreaChart from '../src/data/AreaChart.astro';
import type { ChartError } from '../src/data/chart/errors';
import { areasLarge, areasWithGaps } from './area-fixtures';
import { simple } from './chart-fixtures';
import { renderComponent, renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par pays' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(AreaChart, { props: { ...BASE, dataset, ...props } });
const withValues = (dataset: Dataset, values: (number | null)[]): Dataset => ({
  ...dataset,
  series: [{ id: 'a', label: 'A', unit: 'visites', values }],
});

describe('AreaChart (états et erreurs)', () => {
  it('affiche l’état vide, tableau conservé', async () => {
    const document = await render(withValues(simple(), Array<null>(30).fill(null)));
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Aucune donnée à afficher.',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(30);
  });

  it('affiche l’état d’erreur avec le code pour un empilement négatif, tableau conservé', async () => {
    const data = areasLarge(5, 2);
    const bad = {
      ...data,
      series: data.series.map((s) => ({
        ...s,
        values: s.values.map((v) => (v === null ? v : -v)),
      })),
    };
    const document = await render(bad);
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[data-state="error"]')?.textContent).toContain(
      'stack.negative-value',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('échoue au build au-delà de 6 séries et refuse un id invalide', async () => {
    const error = await render(areasLarge(5, 7)).catch((e: unknown) => e);
    expect((error as ChartError).code).toBe('chart.too-many-series');
    await expect(render(simple(), { id: 'a b' })).rejects.toThrow(/AreaChart : id attendu/);
  });
});

describe('AreaChart (instantanés des rendus d’essai)', () => {
  it('tient à jour le rendu des aires empilées pour axe', async () => {
    const html = await renderComponent(AreaChart, {
      props: { id: 'budget', title: 'Visites par pays', dataset: areasWithGaps() },
    });
    await expect(html).toMatchFileSnapshot('./fixtures/area-chart.html');
  });
});
