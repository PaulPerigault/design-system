import { describe, expect, it } from 'vitest';
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
const text = (document: Document, selector: string): string =>
  document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('GaugeChart (structure et alternatives textuelles)', () => {
  it('rend un SVG role img nommé par titre puis description, avec valeur et zone', async () => {
    const document = await render({ label: 'Capacité de la salle' });
    const svg = document.querySelector('figure.pp-gauge-chart > svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('taux-t taux-d');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 300 196');
    const desc = text(document, 'desc');
    expect(desc).toContain(
      'Jauge « Capacité de la salle » : 72 % sur un intervalle de 0 % à 100 %',
    );
    expect(desc).toContain('zone « Vigilance »');
    expect(desc).toContain('Zones : Critique : de 0 % à 40 %');
    expect(desc).toContain('Le tableau des données suit le graphique.');
  });

  it('écrit la valeur, l’unité, la zone, le libellé et les bornes : le sens n’est pas dans la couleur', async () => {
    const document = await render({ label: 'Capacité de la salle' });
    expect(text(document, '.pp-gauge-chart__value')).toBe('72%');
    expect(text(document, '.pp-gauge-chart__current')).toBe('Vigilance');
    expect(text(document, '.pp-gauge-chart__label')).toBe('Capacité de la salle');
    expect(text(document, '.pp-gauge-chart__min')).toBe('0 %');
    expect(text(document, '.pp-gauge-chart__max')).toBe('100 %');
    expect(document.querySelectorAll('li').length).toBe(3);
    expect(document.querySelectorAll('pattern')).toHaveLength(3);
  });

  it('lie un tableau des zones dont la ligne actuelle porte la valeur', async () => {
    const rows = [...(await render({})).querySelectorAll('details tbody tr')];
    expect(rows.map((r) => r.querySelector('th')?.textContent)).toEqual([
      'Critique',
      'Vigilance',
      'Nominal',
    ]);
    expect(rows.map((r) => r.querySelectorAll('td')[2]?.textContent)).toEqual(['', '72 %', '']);
  });

  it('n’écrit aucun attribut style ni couleur brute', async () => {
    const html = await renderComponent(GaugeChart, { props: { ...BASE, value: 72 } });
    const clean = html.replace(/&#\d+;|url\(#[\w-]+\)/g, ' ');
    expect(clean).not.toMatch(/\sstyle=/);
    expect(clean).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});

describe('GaugeChart (valeurs limites et forme)', () => {
  it.each([
    [120, 'au-dessus du maximum'],
    [-5, 'sous le minimum'],
  ])('borne %i et l’écrit : %s', async (value, note) => {
    const document = await render({ value });
    expect(text(document, '.pp-gauge-chart__note')).toBe(note);
    expect(text(document, '.pp-gauge-chart__value')).toBe(`${value}%`);
    expect(text(document, 'desc')).toContain(`Valeur ${note}, représentée à`);
  });

  it('place l’aiguille du minimum à gauche et du maximum à droite', async () => {
    const x = async (value: number): Promise<number> =>
      Number(
        /^M(\S+) /.exec(
          (await render({ value })).querySelector('.pp-gauge-chart__needle')?.getAttribute('d') ??
            '',
        )?.[1],
      );
    expect(await x(0)).toBeLessThan(150);
    expect(await x(100)).toBeGreaterThan(150);
  });

  it('rend le cercle complet sans bornes aux extrémités', async () => {
    const document = await render({ shape: 'full', value: 25 });
    expect(document.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 300 300');
    expect(document.querySelector('.pp-gauge-chart__min')).toBeNull();
  });

  it('tronque un libellé trop long, texte complet dans la description', async () => {
    const label = 'Taux de remplissage moyen des salles de réunion';
    const document = await render({ label });
    expect(text(document, '.pp-gauge-chart__label')).toMatch(/…$/);
    expect(text(document, 'desc')).toContain(label);
  });

  it('s’affiche sans zone : une seule bande, ni légende ni zone écrite', async () => {
    const document = await render({ zones: [] });
    expect(document.querySelectorAll('path.pp-gauge-chart__zone')).toHaveLength(1);
    expect(document.querySelector('ul')).toBeNull();
    expect(document.querySelector('.pp-gauge-chart__current')).toBeNull();
    expect(text(document, 'details tbody th')).toBe('Intervalle');
  });
});
