import { describe, expect, it } from 'vitest';
import LineChart from '../src/data/LineChart.astro';
import { simple, triple, withGaps } from './chart-fixtures';
import { renderComponent, renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par jour' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(LineChart, { props: { ...BASE, dataset, ...props } });

describe('LineChart (structure et alternatives textuelles)', () => {
  it('rend une figure, son titre et un SVG role img nommé par titre puis description', async () => {
    const document = await render(simple(), { class: 'placement' });
    const svg = document.querySelector('figure.pp-line-chart.placement > svg');
    expect(document.querySelector('figcaption')?.textContent).toBe('Visites par jour');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('visites-t visites-d');
    expect(svg?.querySelector('title#visites-t')?.textContent).toBe('Visites par jour');
    expect(svg?.querySelector('path.pp-line-chart__line')?.getAttribute('d')).toMatch(/^M[\d. ]+L/);
  });

  it('décrit la série : extrêmes, tendance chiffrée, axes, renvoi au tableau', async () => {
    const desc = (await render(simple())).querySelector('desc#visites-d')?.textContent ?? '';
    expect(desc).toMatch(/Série « Visites » : de .+ \(1 janvier 2026\) à .+ \(30 janvier 2026\)/);
    expect(desc).toMatch(/(hausse|baisse) de \d+(,\d)?\s%|stable/);
    expect(desc).toContain('minimum');
    expect(desc).toContain('maximum');
    expect(desc).toContain('Axe horizontal : Jour, axe vertical : visites.');
    expect(desc).toContain("L'axe vertical ne part pas de zéro.");
    expect(desc).toContain('Le tableau des données suit le graphique.');
  });

  it('lie un tableau de données dans un details fermé, avec en-têtes de portée', async () => {
    const document = await render(triple());
    const details = document.querySelector('details.pp-line-chart__data');
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toBe('Données du graphique');
    expect(details?.querySelectorAll('thead th[scope="col"]')).toHaveLength(4);
    expect(details?.querySelectorAll('tbody tr')).toHaveLength(30);
    expect(details?.querySelector('tbody th[scope="row"]')?.textContent).toBe('1 janvier 2026');
  });

  it('distingue chaque série sans la couleur : rang, légende, marqueur propre', async () => {
    const document = await render(triple());
    const groups = [...document.querySelectorAll('svg > g[data-series]')];
    expect(groups.map((g) => g.getAttribute('data-series'))).toEqual(['1', '2', '3']);
    const shapes = groups.map((g) =>
      g.querySelector('.pp-line-chart__marker')?.getAttribute('d')?.slice(-12),
    );
    expect(new Set(shapes).size).toBe(3);
    const legend = [...document.querySelectorAll('ul.pp-line-chart__legend[role="list"] li')];
    expect(legend.map((li) => li.textContent?.trim())).toEqual(['France', 'Belgique', 'Suisse']);
    expect(legend[1]?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('rompt la courbe aux valeurs manquantes et les dit dans le tableau et la description', async () => {
    const document = await render(withGaps());
    const path = document.querySelector('svg .pp-line-chart__line')?.getAttribute('d') ?? '';
    expect(path.match(/M/g)).toHaveLength(3);
    expect(document.querySelector('desc')?.textContent).toContain('4 données manquantes');
    expect(document.querySelector('tbody')?.textContent).toContain('donnée manquante');
  });

  it("n'écrit aucun attribut style ni couleur brute", async () => {
    const html = ((await render(triple())).querySelector('figure')?.outerHTML ?? '').replace(
      /&#\d+;/g,
      ' ',
    );
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});

describe('LineChart (instantané)', () => {
  it('le rendu de trois séries correspond à l’instantané lu par le test axe (e2e)', async () => {
    const rendered = await renderComponent(LineChart, { props: { ...BASE, dataset: triple() } });
    const html = rendered.replace(/ data-astro-cid-\w+(?:="")?/g, '');
    await expect(html).toMatchFileSnapshot('./fixtures/line-chart.html');
  });
});
