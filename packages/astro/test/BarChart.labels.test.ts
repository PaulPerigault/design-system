import { describe, expect, it } from 'vitest';
import BarChart from '../src/data/BarChart.astro';
import { renderDom } from './render';

const make = (labels: string[], unit = 'visites') => ({
  schema: 1,
  x: { kind: 'category', label: 'Rubrique', values: labels },
  series: [{ id: 'a', label: 'Visites', unit, values: labels.map((_, i) => 3400 - i * 600) }],
});

/** Libellés de catégories tronqués (ceux qui portent le texte complet dans un `<title>`). */
async function truncated(dataset: unknown): Promise<string[]> {
  const document = await renderDom(BarChart, { props: { id: 'p', title: 'P', dataset } });
  return [...document.querySelectorAll('text[data-axis="x"] > title')].map(
    (title) => title.textContent ?? '',
  );
}

describe('BarChart (libellés de catégories, #143)', () => {
  it('cinq libellés courants de sept caractères tiennent sans troncature', async () => {
    const labels = ['Accueil', 'Journal', 'Contact', 'Guides', 'Projets'];
    expect(await truncated(make(labels))).toEqual([]);
  });

  it('la colonne des graduations ne prend que la place de ses libellés', async () => {
    const document = await renderDom(BarChart, {
      props: { id: 'p', title: 'P', dataset: make(['Accueil', 'Journal']) },
    });
    const axis = document.querySelector('.pp-bar-chart__axis')?.getAttribute('d') ?? '';
    // « 3 000 » : 5 caractères, soit 5 × 8 + 8 = 48 unités (72 avant).
    expect(axis).toMatch(/^M48 /);
  });

  it('l’unité se pose en haut à gauche, hors de la colonne des graduations', async () => {
    const document = await renderDom(BarChart, {
      props: { id: 'p', title: 'P', dataset: make(['Accueil', 'Journal']) },
    });
    const unit = document.querySelector('text[data-axis="unit"]');
    expect(unit?.getAttribute('x')).toBe('0');
    expect(unit?.textContent?.trim()).toBe('visites');
  });

  it('limite connue : au-delà de la place (libellé plus long que la bande), on tronque', async () => {
    const labels = ['Accueil', 'Guides', 'Références', 'Journal', 'Contact'];
    expect(await truncated(make(labels))).toEqual(['Références']);
  });
});
