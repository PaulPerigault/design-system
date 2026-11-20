import { describe, expect, it } from 'vitest';
import { isDate, isHref, isId } from '../src/fields.ts';

describe('dates', () => {
  it('AAAA-MM et AAAA-MM-JJ qui existent', () => {
    for (const date of [
      '2026-01',
      '2026-12',
      '2026-02-28',
      '2024-02-29',
      '2026-12-31',
      '0001-01',
    ]) {
      expect(isDate(date), date).toBe(true);
    }
  });

  it('refuse les mois, jours, formats et années bissextiles faux', () => {
    const bad = [
      '2026-00',
      '2026-13',
      '2026-02-29',
      '2026-04-31',
      '2026-01-00',
      '2026-1',
      '26-01',
      '2026/01',
      '2026-01-1',
      '2026-01-01T00:00',
      ' 2026-01',
      '',
    ];
    for (const date of bad) expect(isDate(date), date).toBe(false);
  });
});

describe('liens', () => {
  it('accepte https absolu et chemins relatifs', () => {
    for (const href of [
      'https://exemple.fr/a?b=1#c',
      '/a',
      '/a/b',
      './a',
      '../a',
      'a/b',
      '#ancre',
      '?q=1',
    ]) {
      expect(isHref(href), href).toBe(true);
    }
  });

  it('refuse les autres schémas, les URL sans hôte et les caractères interdits', () => {
    const bad = [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,x',
      'http://a.fr',
      'ftp://a.fr',
      'mailto:a@b.fr',
      '//evil.fr/a',
      'https://',
      '/a b',
      'a\\b',
      '/a\nb',
      '',
      ' /a',
    ];
    for (const href of bad) expect(isHref(href), JSON.stringify(href)).toBe(false);
  });

  it('identifiant : minuscules, chiffres, tiret', () => {
    expect(isId('abc-12')).toBe(true);
    expect(isId('Abc')).toBe(false);
  });
});
