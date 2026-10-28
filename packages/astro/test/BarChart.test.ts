import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { barsGrouped, barsNegativeGaps, barsSimple, daily } from './chart-fixtures';
import { renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par pays' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(BarChart, { props: { ...BASE, dataset, ...props } });

/** Rectangles `Mx yhwvhh-wz` d'un chemin : x, y, largeur, hauteur. */
const rectsOf = (path: Element | null): number[][] =>
  [...(path?.getAttribute('d') ?? '').matchAll(/M(\S+) (\S+)h(\S+)v(\S+)h/g)].map((m) =>
    m.slice(1).map(Number),
  );
const axisCoordinate = (document: Document, pattern: RegExp): number =>
  Number(pattern.exec(document.querySelector('.pp-bar-chart__axis')?.getAttribute('d') ?? '')?.[1]);

describe('BarChart (structure et alternatives textuelles)', () => {
  it('rend une figure, son titre et un SVG role img nommé par titre puis description', async () => {
    const document = await render(barsSimple(), { class: 'placement' });
    const svg = document.querySelector('figure.pp-bar-chart.placement > svg');
    expect(document.querySelector('figcaption')?.textContent).toBe('Visites par pays');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('visites-t visites-d');
    expect(svg?.querySelector('title#visites-t')?.textContent).toBe('Visites par pays');
  });

  it('décrit la série : extrêmes, axes, base zéro, renvoi au tableau', async () => {
    const desc = (await render(barsSimple())).querySelector('desc#visites-d')?.textContent ?? '';
    expect(desc).toMatch(
      /Série « Visites » : maximum 1.240.visites \(France\) ; minimum 95.visites/,
    );
    expect(desc).toContain('Axe horizontal : Pays, axe vertical : visites.');
    expect(desc).toContain("L'axe des valeurs part de zéro.");
    expect(desc).toContain('Le tableau des données suit le graphique.');
  });

  it('permute les axes de la description pour des barres horizontales', async () => {
    const document = await render(barsSimple(), { orientation: 'horizontal' });
    expect(document.querySelector('desc')?.textContent).toContain(
      'Axe horizontal : visites, axe vertical : Pays.',
    );
  });

  it('lie un tableau de données dans un details fermé, avec en-têtes de portée', async () => {
    const details = (await render(barsGrouped())).querySelector('details.pp-bar-chart__data');
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelectorAll('thead th[scope="col"]')).toHaveLength(4);
    expect(details?.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(details?.querySelector('tbody th[scope="row"]')?.textContent).toBe('France');
  });

  it("n'écrit aucun attribut style ni couleur brute", async () => {
    const html = (
      (await render(barsGrouped(), { showValues: true })).querySelector('figure')?.outerHTML ?? ''
    ).replace(/&#\d+;|url\(#[\w-]+\)/g, ' ');
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});

describe('BarChart (géométrie)', () => {
  it('part toujours de zéro : les barres touchent la base, même si toutes les valeurs sont hautes', async () => {
    const high = daily(3, [{ id: 'a', label: 'A', values: [900, 950, 990] }]);
    const document = await render({ ...high, x: { ...high.x, kind: 'category' } });
    const base = axisCoordinate(document, /M\S+ (\S+)H/);
    const ticks = [...document.querySelectorAll('text[data-axis="y"]')].map((t) => t.textContent);
    expect(ticks[0]).toBe('0');
    for (const [, y, , height] of rectsOf(document.querySelector('svg > g > .pp-bar-chart__bar'))) {
      expect((y ?? 0) + (height ?? 0)).toBeCloseTo(base, 1);
    }
  });

  it('place les valeurs négatives sous la base et les positives au-dessus', async () => {
    const document = await render(barsNegativeGaps());
    const base = axisCoordinate(document, /M\S+ (\S+)H/);
    const [results] = [...document.querySelectorAll('svg > g > .pp-bar-chart__bar')];
    const [first, second] = rectsOf(results ?? null);
    expect((first?.[1] ?? 0) + (first?.[3] ?? 0)).toBeCloseTo(base, 1);
    expect(second?.[1]).toBeCloseTo(base, 1);
  });

  it('laisse un vide aux valeurs manquantes et les dit dans le tableau et la description', async () => {
    const document = await render(barsNegativeGaps());
    const paths = [...document.querySelectorAll('svg > g > .pp-bar-chart__bar')];
    expect(paths.map((path) => rectsOf(path).length)).toEqual([4, 6]);
    expect(document.querySelector('desc')?.textContent).toContain('2 données manquantes');
    expect(document.querySelector('tbody')?.textContent).toContain('donnée manquante');
  });

  it('range les catégories de haut en bas pour des barres horizontales', async () => {
    const document = await render(barsGrouped(), { orientation: 'horizontal' });
    const [first] = [...document.querySelectorAll('svg > g > .pp-bar-chart__bar')];
    const ys = rectsOf(first ?? null).map(([, y]) => y ?? 0);
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(document.querySelector('.pp-bar-chart__axis')?.getAttribute('d')).toMatch(/V/);
  });
});
