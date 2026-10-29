import { describe, expect, it } from 'vitest';
import { ChartError } from '../src/data/chart/errors';
import DataTable from '../src/data/DataTable.astro';
import { renderComponent, renderDom } from './render';
import { RISING, WITH_GAP } from './sparkline-fixtures';

const [first] = RISING.series;
const TWO = { ...RISING, series: [first, { ...first, id: 'b', label: 'Pages vues', unit: '' }] };
const BASE = { id: 'trafic', title: 'Trafic mensuel' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(DataTable, { props: { ...BASE, dataset, ...props } });
const codeOf = async (dataset: unknown): Promise<string | undefined> => {
  const error = await render(dataset).catch((e: unknown) => e);
  return error instanceof ChartError ? error.code : undefined;
};

describe('DataTable (structure)', () => {
  it('associe les en-têtes : th col pour les séries, th row pour l’abscisse', async () => {
    const document = await render(TWO);
    expect(document.querySelector('caption')?.textContent).toBe('Trafic mensuel');
    const heads = [...document.querySelectorAll('thead th')].map((th) => th.getAttribute('scope'));
    expect(heads).toEqual(['col', 'col', 'col']);
    expect(document.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(document.querySelector('tbody tr th')?.getAttribute('scope')).toBe('row');
    expect(document.querySelector('tbody tr th')?.textContent).toBe('janvier 2026');
  });

  it('dit la valeur manquante au lieu de l’omettre', async () => {
    const document = await render(WITH_GAP);
    expect(document.querySelectorAll('tbody tr')[2]?.textContent).toContain('donnée manquante');
  });

  it('propose un filtre natif par série, tous cochés : tableau complet sans filtre', async () => {
    const document = await render(TWO);
    const boxes = [...document.querySelectorAll('fieldset input[type="checkbox"]')];
    expect(boxes.map((box) => box.getAttribute('value'))).toEqual(['col-1', 'col-2']);
    expect(boxes.every((box) => box.hasAttribute('checked'))).toBe(true);
    expect(document.querySelector('fieldset legend')?.textContent).toBe('Séries affichées');
    expect(document.querySelector('label[for="trafic-f1"]')?.textContent?.trim()).toBe('Visites');
  });

  it('sans filtre pour une série seule ou à la demande', async () => {
    expect((await render(RISING)).querySelector('fieldset')).toBeNull();
    expect((await render(TWO, { filters: false })).querySelector('fieldset')).toBeNull();
  });

  it('n’écrit aucun attribut style et aucun script', async () => {
    const html = await renderComponent(DataTable, { props: { ...BASE, dataset: TWO } });
    expect(html).not.toMatch(/\sstyle=|<script/);
  });
});

describe('DataTable (erreurs)', () => {
  it.each([
    ['dataset.bad-shape', { schema: 1 }],
    ['dataset.non-finite', { ...RISING, series: [{ ...first, values: [1, Number.NaN] }] }],
  ])('échoue au build avec le code %s', async (code, dataset) => {
    expect(await codeOf(dataset)).toBe(code);
  });

  it('refuse un id invalide', async () => {
    await expect(render(RISING, { id: 'a b' })).rejects.toThrow(/DataTable : id attendu/);
  });

  it('tient à jour le rendu d’essai pour axe', async () => {
    const html = await renderComponent(DataTable, { props: { ...BASE, dataset: TWO } });
    await expect(html).toMatchFileSnapshot('./fixtures/data-table.html');
  });
});
