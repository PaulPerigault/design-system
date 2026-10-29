import { describe, expect, it } from 'vitest';
import { ChartError } from '../src/data/chart/errors';
import Sparkline from '../src/data/Sparkline.astro';
import { renderComponent, renderDom } from './render';
import { ALL_MISSING, RISING, longSeries } from './sparkline-fixtures';

const BASE = { id: 'visites', title: 'Visites mensuelles' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Sparkline, { props: { ...BASE, dataset, ...props } });
const codeOf = async (dataset: unknown): Promise<string | undefined> => {
  const error = await render(dataset).catch((e: unknown) => e);
  return error instanceof ChartError ? error.code : undefined;
};

const [first] = RISING.series;
const TWO_SERIES = { ...RISING, series: [...RISING.series, { ...first, id: 'other' }] };
const NOT_FINITE = { ...RISING, series: [{ ...first, values: [1, Number.NaN] }] };
const BACKWARDS = {
  ...RISING,
  x: { ...RISING.x, values: ['2026-03', '2026-02', '2026-01', '2026-04', '2026-05', '2026-06'] },
};

describe('Sparkline (états et erreurs)', () => {
  it('affiche l’état vide sans valeur, tableau conservé', async () => {
    const document = await render(ALL_MISSING);
    expect(document.querySelector('svg')).toBeNull();
    expect(document.querySelector('[role="status"]')?.textContent).toBe(
      'Aucune donnée à afficher.',
    );
    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it.each([
    ['chart.too-many-series', TWO_SERIES],
    ['dataset.bad-shape', { schema: 1 }],
    ['dataset.non-finite', NOT_FINITE],
    ['geometry.bad-input', BACKWARDS],
  ])('échoue au build avec le code %s', async (code, dataset) => {
    expect(await codeOf(dataset)).toBe(code);
  });

  it('refuse un id invalide et une locale inconnue', async () => {
    await expect(render(RISING, { id: 'a b' })).rejects.toThrow(/Sparkline : id attendu/);
    await expect(render(RISING, { locale: 'zz-invalide-' })).rejects.toThrow(/format\.bad-locale/);
  });
});

describe('Sparkline (budget, ADR-0007)', () => {
  it.each([6, 120, 500])('%i points : au plus 10 ko et 400 nœuds', async (count) => {
    const svg = (await render(longSeries(count))).querySelector('figure > svg');
    expect(Buffer.byteLength(svg?.outerHTML ?? '')).toBeLessThanOrEqual(10_000);
    expect((svg?.querySelectorAll('*').length ?? 0) + 1).toBeLessThanOrEqual(400);
  });

  it('tient à jour le rendu d’essai pour axe', async () => {
    const html = await renderComponent(Sparkline, { props: { ...BASE, dataset: RISING } });
    await expect(html).toMatchFileSnapshot('./fixtures/sparkline.html');
  });
});
