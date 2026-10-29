import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { barsGrouped, barsLongLabels, barsSimple } from './chart-fixtures';
import { renderComponent, renderDom } from './render';

const BASE = { id: 'visites', title: 'Visites par pays' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(BarChart, { props: { ...BASE, dataset, ...props } });

describe('BarChart (séries sans la couleur seule)', () => {
  it('donne à chaque rang un motif propre, relié à ses barres et à la légende', async () => {
    const document = await render(barsGrouped());
    const patterns = [...document.querySelectorAll('defs > pattern')];
    expect(patterns.map((p) => p.id)).toEqual(['visites-p1', 'visites-p2', 'visites-p3']);
    const marks = patterns.map((p) => p.querySelector('.pp-bar-chart__mark')?.getAttribute('d'));
    expect(marks[0]).toBeUndefined();
    expect(new Set(marks).size).toBe(3);
    const fills = [...document.querySelectorAll('svg > g[data-series] > path')].map((p) =>
      p.getAttribute('fill'),
    );
    expect(fills).toEqual(['url(#visites-p1)', 'url(#visites-p2)', 'url(#visites-p3)']);
    const legend = [...document.querySelectorAll('ul.pp-bar-chart__legend[role="list"] li')];
    expect(legend.map((li) => li.textContent?.trim())).toEqual(['2024', '2025', '2026']);
    expect(legend[2]?.querySelector('path')?.getAttribute('fill')).toBe('url(#visites-p3)');
    expect(legend[1]?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it("n'écrit pas de légende pour une seule série", async () => {
    expect((await render(barsSimple())).querySelector('.pp-bar-chart__legend')).toBeNull();
  });
});

describe('BarChart (libellés et valeurs)', () => {
  it('tronque un libellé long et garde le texte complet dans title', async () => {
    const document = await render(barsLongLabels(), { orientation: 'horizontal' });
    const label = [...document.querySelectorAll('text[data-axis="y"]')][2];
    expect(label?.querySelector('title')?.textContent).toBe(
      'Service juridique, conformité et protection des données',
    );
    expect(label?.textContent).toContain('…');
    expect(label?.querySelectorAll('tspan')).toHaveLength(1);
  });

  it('ne met pas de title à un libellé qui tient en entier', async () => {
    const label = (await render(barsSimple())).querySelector('text[data-axis="x"]');
    expect(label?.textContent?.trim()).toBe('France');
    expect(label?.querySelector('title')).toBeNull();
  });

  it('écrit les valeurs dans les barres seulement si toutes ont la place', async () => {
    const shown = await render(barsSimple(), { showValues: true });
    expect(shown.querySelectorAll('.pp-bar-chart__value')).toHaveLength(5);
    const crowded = await render(barsGrouped(), { showValues: true });
    expect(crowded.querySelectorAll('.pp-bar-chart__value')).toHaveLength(0);
    expect((await render(barsSimple())).querySelectorAll('.pp-bar-chart__value')).toHaveLength(0);
  });

  it('place une valeur trop courte pour tenir au bout de sa barre', async () => {
    const document = await render(barsLongLabels(), {
      orientation: 'horizontal',
      showValues: true,
    });
    const anchors = [...document.querySelectorAll('.pp-bar-chart__value')].map((v) =>
      v.getAttribute('data-anchor'),
    );
    expect(anchors).toEqual(['end', 'end', 'end', 'start', 'start']);
  });
});

describe('BarChart (instantané)', () => {
  it.each([
    ['bar-chart', barsGrouped(), {}],
    ['bar-chart-horizontal', barsLongLabels(), { orientation: 'horizontal', showValues: true }],
  ])(
    'le rendu %s correspond à l’instantané lu par le test axe (e2e)',
    async (name, dataset, props) => {
      const rendered = await renderComponent(BarChart, {
        props: { id: 'budget', title: 'Budget par direction', dataset, ...props },
      });
      const html = rendered.replace(/ data-astro-cid-\w+(?:="")?/g, '');
      await expect(html).toMatchFileSnapshot(`./fixtures/${name}.html`);
    },
  );
});
