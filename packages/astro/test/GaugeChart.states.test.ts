import { describe, expect, it } from 'vitest';
import { ChartError } from '../src/data/chart/errors';
import GaugeChart from '../src/data/GaugeChart.astro';
import { renderComponent, renderDom } from './render';

const ZONES = [
  { label: 'Critique', to: 40, tone: 'bad' },
  { label: 'Vigilance', to: 80, tone: 'warning' },
  { label: 'Nominal', tone: 'good' },
];
const BASE = { id: 'taux', title: 'Taux de remplissage', unit: '%', zones: ZONES };
const render = (props: Record<string, unknown>): Promise<Document> =>
  renderDom(GaugeChart, { props: { ...BASE, value: 72, ...props } });
const codeOf = async (props: Record<string, unknown>): Promise<string | undefined> => {
  const error = await render(props).catch((e: unknown) => e);
  return error instanceof ChartError ? error.code : undefined;
};
const text = (document: Document, selector: string): string =>
  document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('GaugeChart (états et erreurs)', () => {
  it('affiche l’état vide sans valeur, tableau des zones conservé', async () => {
    const document = await render({ value: null });
    expect(document.querySelector('svg')).toBeNull();
    expect(text(document, '[role="status"]')).toBe('Aucune donnée à afficher.');
    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it.each([
    ['gauge.bad-range', { min: 5, max: 5, zones: [] }],
    ['gauge.bad-range', { min: 10, max: 0, zones: [] }],
    [
      'gauge.bad-thresholds',
      { zones: [{ label: 'a', to: 80 }, { label: 'b', to: 40 }, { label: 'c' }] },
    ],
    ['gauge.bad-thresholds', { zones: [{ label: 'a' }, { label: 'b' }] }],
    [
      'gauge.bad-thresholds',
      {
        zones: [
          { label: 'a', to: 50 },
          { label: 'b', to: 90 },
        ],
      },
    ],
    ['geometry.bad-input', { value: Number.NaN }],
  ])('échoue au build avec le code %s', async (code, props) => {
    expect(await codeOf(props)).toBe(code);
  });

  it('refuse un id invalide', async () => {
    await expect(render({ id: 'a b' })).rejects.toThrow(/GaugeChart : id attendu/);
  });
});

describe('GaugeChart (budget, ADR-0007)', () => {
  it.each(['half', 'full'])('%s : au plus 10 ko et 400 nœuds', async (shape) => {
    const svg = (await render({ shape, label: 'Capacité' })).querySelector('figure > svg');
    expect(Buffer.byteLength(svg?.outerHTML ?? '')).toBeLessThanOrEqual(10_000);
    expect((svg?.querySelectorAll('*').length ?? 0) + 1).toBeLessThanOrEqual(400);
  });

  it('tient à jour le rendu d’essai pour axe', async () => {
    const html = await renderComponent(GaugeChart, {
      props: { ...BASE, value: 72, label: 'Capacité' },
    });
    await expect(html).toMatchFileSnapshot('./fixtures/gauge-chart.html');
  });
});
