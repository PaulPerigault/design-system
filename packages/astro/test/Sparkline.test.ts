import { describe, expect, it } from 'vitest';
import Sparkline from '../src/data/Sparkline.astro';
import { renderComponent, renderDom } from './render';
import { ENDS_ON_GAP, FLAT, RISING, WITH_GAP, visits } from './sparkline-fixtures';

const BASE = { id: 'visites', title: 'Visites mensuelles' };
const render = (dataset: unknown, props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Sparkline, { props: { ...BASE, dataset, ...props } });
const text = (document: Document, selector: string): string =>
  document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('Sparkline (structure et alternatives textuelles)', () => {
  it('rend un SVG role img nommé par titre puis description, sans script ni texte', async () => {
    const document = await render(RISING);
    const svg = document.querySelector('figure.pp-sparkline > svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-labelledby')).toBe('visites-t visites-d');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 360 64');
    expect(document.querySelectorAll('script')).toHaveLength(0);
    expect(svg?.querySelector('text')).toBeNull();
  });

  it('dit la tendance chiffrée, les extrêmes et le renvoi au tableau dans le desc', async () => {
    const desc = text(await render(RISING), 'desc');
    expect(desc).toContain('Sparkline « Visites mensuelles » : Série « Visites » :');
    expect(desc).toContain('de 120 visites (janvier 2026) à 340 visites (juin 2026), hausse de');
    expect(desc).toContain('minimum 120 visites (janvier 2026) ; maximum 340 visites (juin 2026).');
    expect(desc).toContain('Le tableau des données suit le graphique.');
  });

  it('trace en un chemin et marque point final, plus haut et plus bas, valeurs écrites', async () => {
    const document = await render(RISING);
    expect(document.querySelectorAll('figure > svg .pp-sparkline__line')).toHaveLength(1);
    expect(document.querySelectorAll('figure > svg .pp-sparkline__end')).toHaveLength(1);
    expect(document.querySelectorAll('figure > svg .pp-sparkline__min')).toHaveLength(1);
    // Le point final est aussi le maximum : les deux formes sont dessinées, l'une sur l'autre.
    expect(document.querySelectorAll('figure > svg .pp-sparkline__max')).toHaveLength(1);
    const legend = [...document.querySelectorAll('.pp-sparkline__legend li')].map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(legend).toEqual([
      'Dernière valeur : 340 visites (juin 2026)',
      'Plus haut : 340 visites (juin 2026)',
      'Plus bas : 120 visites (janvier 2026)',
    ]);
  });

  it('lie le tableau de toutes les valeurs, la valeur manquante dite', async () => {
    const rows = [...(await render(WITH_GAP)).querySelectorAll('details tbody tr')];
    expect(rows).toHaveLength(6);
    expect(rows[2]?.textContent).toContain('donnée manquante');
  });

  it('rompt le tracé sur un trou, sans inventer la valeur absente', async () => {
    const document = await render(WITH_GAP);
    const d = document.querySelector('.pp-sparkline__line')?.getAttribute('d') ?? '';
    expect(d.match(/M/g)).toHaveLength(2);
    expect(text(document, 'desc')).toContain('1 donnée manquante.');
  });

  it('dit qu’une série finit sur un trou et marque le dernier point présent', async () => {
    const document = await render(ENDS_ON_GAP);
    expect(text(document, 'desc')).toContain('La série se termine par une donnée manquante.');
    expect(text(document, '.pp-sparkline__legend li')).toBe(
      'Dernière valeur : 260 visites (mai 2026)',
    );
  });

  it('accepte une série constante', async () => {
    const document = await render(FLAT);
    expect(document.querySelector('.pp-sparkline__line')?.getAttribute('d')).toMatch(/^M/);
  });

  it('masque la légende à la demande, le tableau et le desc restent', async () => {
    const document = await render(RISING, { legend: false });
    expect(document.querySelector('.pp-sparkline__legend')).toBeNull();
    expect(document.querySelector('details table')).not.toBeNull();
  });

  it('sans unité, écrit le nombre seul', async () => {
    const document = await render(visits([1, 2, 3], ''));
    expect(text(document, '.pp-sparkline__legend li')).toContain('3 (mars 2026)');
  });

  it('n’écrit aucun attribut style ni couleur brute', async () => {
    const html = await renderComponent(Sparkline, { props: { ...BASE, dataset: RISING } });
    const clean = html.replace(/&#\d+;|url\(#[\w-]+\)/g, ' ');
    expect(clean).not.toMatch(/\sstyle=/);
    expect(clean).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
  });
});
