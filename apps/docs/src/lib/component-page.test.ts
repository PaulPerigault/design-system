import { describe, expect, it } from 'vitest';
import { SECTIONS, validate } from './component-page.ts';
import type { ComponentPageData } from './component-page.ts';

const valid = (): ComponentPageData => ({
  slug: 'demo',
  title: 'Demo',
  summary: 'Une phrase.',
  use: ['Cas'],
  avoid: ['Contre-cas'],
  snippet: '<Demo />',
  a11y: { keyboard: ['a'], screenReader: ['b'], guaranteed: ['c'], integrator: ['d'] },
  evidence: [{ label: 'Source' }],
});

describe('SECTIONS', () => {
  it('garde l’ordre fixe du gabarit', () => {
    expect(SECTIONS.map((section) => section.id)).toEqual([
      'sert',
      'quand',
      'eviter',
      'exemples',
      'variantes',
      'accessibilite',
      'proprietes',
      'jetons',
      'preuves',
    ]);
  });
});

describe('validate', () => {
  it('accepte des données complètes', () => {
    const data = valid();
    expect(validate(data)).toBe(data);
  });

  it.each([
    ['summary', (d: ComponentPageData) => (d.summary = '  ')],
    ['use', (d: ComponentPageData) => (d.use = [])],
    ['avoid', (d: ComponentPageData) => (d.avoid = [])],
    ['a11y.keyboard', (d: ComponentPageData) => (d.a11y.keyboard = [])],
    ['a11y.screenReader', (d: ComponentPageData) => (d.a11y.screenReader = [])],
    ['a11y.guaranteed', (d: ComponentPageData) => (d.a11y.guaranteed = [])],
    ['a11y.integrator', (d: ComponentPageData) => (d.a11y.integrator = [])],
    ['evidence', (d: ComponentPageData) => (d.evidence = [])],
  ])('refuse un champ vide : %s', (name, empty) => {
    const data = valid();
    empty(data);
    expect(() => validate(data)).toThrow(`« ${name} » est vide`);
  });
});
