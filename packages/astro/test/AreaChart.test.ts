import type { Dataset } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import AreaChart from '../src/data/AreaChart.astro';
import { layer, pointCount } from './area-dom';
import { areasWithGaps } from './area-fixtures';
import { large, simple, triple } from './chart-fixtures';
import { renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par pays' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(AreaChart, { props: { ...BASE, dataset, ...props } });
const shape = (document: Document, rank: number): string => layer(document, rank, 'area');
const withValues = (dataset: Dataset, values: (number | null)[]): Dataset => ({
  ...dataset,
  series: [{ id: 'a', label: 'A', unit: 'visites', values }],
});

describe('AreaChart (structure et alternatives textuelles)', () => {
  it('rend une figure et un SVG role img nommé par titre puis description', async () => {
    const document = await render(simple(), { class: 'placement' });
    const svg = document.querySelector('figure.pp-area-chart.placement > svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('visites-t visites-d');
    expect(document.querySelector('title#visites-t')?.textContent).toBe('Visites par pays');
  });

  it('décrit la série, la base zéro et renvoie au tableau', async () => {
    const desc = (await render(simple())).querySelector('desc')?.textContent ?? '';
    expect(desc).toContain('Série « Visites » : de ');
    expect(desc).toContain("L'axe vertical part de zéro.");
    expect(desc).not.toContain('empilées');
    expect(desc).toContain('Le tableau des données suit le graphique.');
  });

  it('décrit l’empilement et le total cumulé', async () => {
    const desc = (await render(triple())).querySelector('desc')?.textContent ?? '';
    expect(desc).toContain("Les aires sont empilées dans l'ordre des séries.");
    expect(desc).toContain('Série « Total empilé » : de ');
  });

  it('lie un tableau de données complet dans un details fermé', async () => {
    const details = (await render(triple())).querySelector('details.pp-area-chart__data');
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelectorAll('thead th[scope="col"]')).toHaveLength(4);
    expect(details?.querySelectorAll('tbody tr')).toHaveLength(30);
  });

  it('n’écrit aucun attribut style ni couleur brute', async () => {
    const html = (await render(areasWithGaps())).querySelector('figure')?.outerHTML ?? '';
    const text = html.replace(/&#\d+;|url\(#[\w-]+\)/g, ' ');
    expect(text).not.toMatch(/\sstyle=/);
    expect(text).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});

describe('AreaChart (géométrie)', () => {
  it('empile : le haut de la couche 2 passe au-dessus du haut de la couche 1', async () => {
    const document = await render(triple());
    const firstY = Number(/^M[^ ]+ ([\d.]+)/.exec(shape(document, 1))?.[1]);
    const secondY = Number(/^M[^ ]+ ([\d.]+)/.exec(shape(document, 2))?.[1]);
    expect(secondY).toBeLessThan(firstY);
  });

  it('rompt la couche aux trous sans la rabattre à zéro et le dit', async () => {
    const document = await render(areasWithGaps());
    expect(shape(document, 2).match(/M/g)?.length).toBeGreaterThan(1);
    expect(shape(document, 1).match(/M/g)).toHaveLength(1);
    expect(document.querySelector('desc')?.textContent).toContain('Une donnée manquante');
    expect(document.querySelector('tbody')?.textContent).toContain('donnée manquante');
  });

  it('part toujours de zéro, même avec des valeurs hautes', async () => {
    const document = await render(withValues(simple(), Array<number>(30).fill(900)));
    const ticks = [...document.querySelectorAll('text[data-axis="y"]')].map((t) => t.textContent);
    expect(ticks[0]).toBe('0');
  });

  it('marque un point isolé que l’aire ne peut pas dessiner', async () => {
    const values = Array<number | null>(30).fill(null);
    values[5] = 40;
    const document = await render(withValues(simple(), values));
    expect(document.querySelector('path.pp-area-chart__marker')).not.toBeNull();
    expect(shape(document, 1)).toBe('');
  });

  it('échantillonne par LTTB au-delà de la cible et garde le tableau complet', async () => {
    const document = await render(large(1));
    expect(pointCount(layer(document, 1, 'line'))).toBeLessThan(260);
    expect(document.querySelectorAll('tbody tr')).toHaveLength(500);
  });
});
