import { describe, expect, it } from 'vitest';
import type { Formatter } from '../src/application/ports.ts';
import { createFormatter } from '../src/infrastructure/intl-formatter.ts';

const NNBSP = String.fromCodePoint(0x202f);

const fr = (): Formatter => {
  const result = createFormatter();
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('formatage fr', () => {
  it('virgule décimale et espace fine insécable entre les milliers', () => {
    expect(fr().number(1234567.891)).toBe('1 234 567,89');
  });

  it('unité après une espace insécable', () => {
    expect(fr().number(1234.5, '€')).toBe('1 234,5 €');
    expect(fr().number(12, '%')).toBe('12 %');
  });

  it('dit la donnée manquante', () => {
    expect(fr().missing).toBe('donnée manquante');
  });

  it.each([
    ['2026', '2026'],
    ['2026-10', 'octobre 2026'],
    ['2026-10-28', '28 octobre 2026'],
    ['2026-10-28T09:00:00Z', '28 octobre 2026 à 09:00 UTC'],
  ])('date %s → %s', (iso, label) => {
    expect(fr().dateLabel(iso).replace(new RegExp(NNBSP, 'g'), ' ')).toBe(label);
  });

  it('rend le texte tel quel pour une date invalide', () => {
    expect(fr().dateLabel('demain')).toBe('demain');
  });

  it('change de locale', () => {
    const en = createFormatter('en');
    expect(en.ok && en.value.number(1234.5)).toBe('1,234.5');
  });

  it('refuse une locale inconnue par une erreur typée', () => {
    const result = createFormatter('xx-invalid-locale-!');
    expect(!result.ok && result.error.code).toBe('format.bad-locale');
  });
});
