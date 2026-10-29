import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { barsGrouped, barsSimple } from './chart-fixtures';
import { renderDom } from './render';

const BASE = { id: 'ink', title: 'Visites par pays', showValues: true };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(BarChart, { props: { ...BASE, dataset, ...props } });

describe('BarChart (valeurs : neutre selon la série)', () => {
  it('range les valeurs par série, avec le neutre clair puis sombre de la série', async () => {
    const document = await render(barsSimple(), { orientation: 'horizontal' });
    const groups = [...document.querySelectorAll('svg > g[data-ink]')];
    expect(groups.map((g) => [g.getAttribute('data-series'), g.getAttribute('data-ink')])).toEqual([
      ['1', 'bg-bg'],
    ]);
  });

  it('marque `data-in` seulement les valeurs posées sur une barre', async () => {
    const document = await render(barsSimple(), { orientation: 'horizontal' });
    const values = [...document.querySelectorAll('text.pp-bar-chart__value')];
    expect(values).toHaveLength(5);
    const inside = values.filter((v) => v.hasAttribute('data-in'));
    expect(inside.length).toBeGreaterThan(0);
    expect(inside.every((v) => v.getAttribute('data-anchor') === 'end')).toBe(true);
    expect(values.filter((v) => !v.hasAttribute('data-in')).length).toBeGreaterThan(0);
  });

  it('donne à la série 6 un neutre différent en clair (fg) et en sombre (bg)', async () => {
    const six = {
      schema: 1,
      x: { kind: 'category', label: 'Rubrique', values: ['A'] },
      series: Array.from({ length: 6 }, (_, i) => ({
        id: `s${i}`,
        label: `S${i + 1}`,
        unit: '',
        values: [100 + i],
      })),
    };
    const document = await render(six, { orientation: 'horizontal' });
    const inks = [...document.querySelectorAll('svg > g[data-ink]')].map((g) =>
      g.getAttribute('data-ink'),
    );
    expect(inks).toHaveLength(6);
    expect(inks[5]).toBe('fg-bg');
    expect(inks.every((ink) => /^(fg|bg)-(fg|bg)$/.test(ink ?? ''))).toBe(true);
  });

  it('n’ajoute aucun attribut style ni couleur brute', async () => {
    const document = await render(barsGrouped(), { orientation: 'horizontal' });
    const html = (document.querySelector('svg')?.outerHTML ?? '').replace(
      /&#\d+;|url\(#[\w-]+\)/g,
      ' ',
    );
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});
