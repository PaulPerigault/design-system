import { describe, expect, it } from 'vitest';
import { ChartError } from '../src/data/chart/errors';
import KpiCard from '../src/data/KpiCard.astro';
import { renderComponent, renderDom } from './render';
import { RISING, longSeries } from './sparkline-fixtures';

const BASE = { id: 'recettes', title: 'Recettes du mois', unit: '€' };
const render = (props: Record<string, unknown>): Promise<Document> =>
  renderDom(KpiCard, { props: { ...BASE, value: 12_345, reference: 11_850, ...props } });
const text = (document: Document, selector: string): string =>
  document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const codeOf = async (props: Record<string, unknown>): Promise<string | undefined> => {
  const error = await render(props).catch((e: unknown) => e);
  return error instanceof ChartError ? error.code : undefined;
};

describe('KpiCard (structure et texte)', () => {
  it('rend un groupe nommé par le titre, valeur et unité écrites', async () => {
    const document = await render({});
    const group = document.querySelector('.pp-kpi-card');
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-labelledby')).toBe('recettes-t');
    expect(text(document, '#recettes-t')).toBe('Recettes du mois');
    expect(text(document, '.pp-kpi-card__value')).toBe('12 345 €');
  });

  it('dit le sens de la variation en mots, avec le signe et la référence', async () => {
    const document = await render({ referenceLabel: 'par rapport à septembre' });
    const variation = document.querySelector('.pp-kpi-card__variation');
    expect(variation?.getAttribute('data-direction')).toBe('up');
    expect(text(document, '.pp-kpi-card__variation')).toBe(
      'Hausse de 4,18 % (+495 €) par rapport à septembre',
    );
  });

  it.each([
    [15_000, 'down', 'Baisse de 20 % (−3 000 €)'],
    [12_000, 'flat', 'Stable'],
  ])('référence %i : sens %s, texte « %s »', async (reference, direction, words) => {
    const document = await render({ value: 12_000, reference });
    const variation = document.querySelector('.pp-kpi-card__variation');
    expect(variation?.getAttribute('data-direction')).toBe(direction);
    expect(text(document, '.pp-kpi-card__variation')).toBe(words);
  });

  it('référence nulle : variation absolue, jamais de division par zéro', async () => {
    const document = await render({ value: 12_000, reference: 0 });
    expect(text(document, '.pp-kpi-card__variation')).toBe('Hausse de 12 000 €');
  });

  it('sans référence, aucune variation', async () => {
    const document = await render({ reference: null });
    expect(document.querySelector('.pp-kpi-card__variation')).toBeNull();
    expect(text(document, '.pp-kpi-card__value')).toBe('12 345 €');
  });

  it('inclut une sparkline nommée, sans légende, avec son tableau lié', async () => {
    const document = await render({ trend: { title: 'Visites par mois', dataset: RISING } });
    expect(
      document.querySelector('figure.pp-sparkline > svg')?.getAttribute('aria-labelledby'),
    ).toBe('recettes-trend-t recettes-trend-d');
    expect(document.querySelector('.pp-sparkline__legend')).toBeNull();
    expect(document.querySelectorAll('details tbody tr')).toHaveLength(6);
  });

  it('n’écrit aucun attribut style ni couleur brute', async () => {
    const html = await renderComponent(KpiCard, { props: { ...BASE, value: 1, reference: 2 } });
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});

describe('KpiCard (états et erreurs)', () => {
  it('affiche l’état vide sans valeur', async () => {
    const document = await render({ value: null });
    expect(text(document, '[role="status"]')).toBe('Aucune donnée à afficher.');
    expect(document.querySelector('.pp-kpi-card__value')).toBeNull();
  });

  it.each([
    ['kpi.bad-value', { value: Number.NaN }],
    ['kpi.bad-reference', { reference: Number.POSITIVE_INFINITY }],
    ['kpi.unreadable', { value: 1_234_567_890 }],
    ['format.bad-locale', { locale: 'zz-invalide-' }],
    ['dataset.bad-shape', { trend: { title: 'T', dataset: { schema: 1 } } }],
  ])('échoue au build avec le code %s', async (code, props) => {
    expect(await codeOf(props)).toBe(code);
  });

  it('refuse un id invalide', async () => {
    await expect(render({ id: 'a b' })).rejects.toThrow(/KpiCard : id attendu/);
  });

  it('tient à jour le rendu d’essai pour axe', async () => {
    const html = await renderComponent(KpiCard, {
      props: {
        ...BASE,
        value: 12_345,
        reference: 11_850,
        referenceLabel: 'par rapport à septembre',
        trend: { title: 'Recettes par mois', dataset: RISING },
      },
    });
    await expect(html).toMatchFileSnapshot('./fixtures/kpi-card.html');
  });
});

describe('KpiCard (budget, ADR-0007)', () => {
  it('500 points de tendance : au plus 10 ko et 400 nœuds, tableau lié exclu', async () => {
    const document = await render({ trend: { title: 'Tendance', dataset: longSeries(500) } });
    document.querySelector('details')?.remove();
    const card = document.querySelector('.pp-kpi-card');
    expect(Buffer.byteLength(card?.outerHTML ?? '')).toBeLessThanOrEqual(10_000);
    expect((card?.querySelectorAll('*').length ?? 0) + 1).toBeLessThanOrEqual(400);
  });
});
