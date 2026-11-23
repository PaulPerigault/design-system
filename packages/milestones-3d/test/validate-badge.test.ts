import { describe, expect, it } from 'vitest';
import { validateData } from '../src/validate.ts';
import { codeOf, one } from './support-validate.ts';

describe('badge', () => {
  const withBadge = (badge: unknown, status = 'achieved') => ({
    milestones: [{ ...one, status, badge }],
  });

  it('accepte un chemin relatif ou https:, avec dimensions facultatives', () => {
    for (const src of [
      '/badges/a.webp',
      './a.avif',
      'badges/a.webp',
      'https://exemple.fr/a.webp',
    ]) {
      expect(codeOf(withBadge({ src })), src).toBeUndefined();
    }
    const data = validateData(withBadge({ src: '/a.webp', width: 340, height: 340, extra: 1 }));
    expect(data.milestones[0]?.badge).toEqual({ src: '/a.webp', width: 340, height: 340 });
  });

  it('refuse un jalon planifié qui porte un badge : jamais un niveau non obtenu', () => {
    expect(codeOf(withBadge({ src: '/a.webp' }, 'planned'))).toBe('planned-badge');
    expect(() => validateData(withBadge({ src: '/a.webp' }, 'planned'))).toThrow(
      /planned-badge.*milestones\[0\]\.badge/,
    );
    expect(codeOf({ milestones: [{ ...one, status: 'planned' }] })).toBeUndefined();
  });

  it('refuse les sources dangereuses', () => {
    const bad = [
      'javascript:alert(1)',
      'data:image/png;base64,AAAA',
      'http://exemple.fr/a.webp',
      'blob:https://exemple.fr/x',
      '//exemple.fr/a.webp',
      'a b.webp',
      '..\\a.webp',
      'JaVaScRiPt:1',
    ];
    for (const src of bad) expect(codeOf(withBadge({ src })), src).toBe('invalid-badge');
    expect(() => validateData(withBadge({ src: 'data:x' }))).toThrow(/milestones\[0\]\.badge\.src/);
  });

  it('refuse un badge mal formé', () => {
    expect(codeOf(withBadge('a.webp'))).toBe('invalid-badge');
    expect(codeOf(withBadge({}))).toBe('invalid-label');
    expect(codeOf(withBadge({ src: '/a.webp', width: 0 }))).toBe('invalid-badge');
    expect(codeOf(withBadge({ src: '/a.webp', height: 1.5 }))).toBe('invalid-badge');
    expect(codeOf(withBadge({ src: '/a.webp', width: '3' }))).toBe('invalid-badge');
  });
});

describe('cible finale', () => {
  it('facultative, avec libellé, date et lien facultatifs', () => {
    const goal = validateData({
      milestones: [one],
      goal: { label: 'But', date: '2027-06', href: '/but' },
    }).goal;
    expect(goal).toEqual({ label: 'But', date: '2027-06', href: '/but' });
    expect(validateData({ milestones: [one] })).not.toHaveProperty('goal');
  });

  it('refuse une cible sans libellé ou avec un lien invalide', () => {
    expect(codeOf({ milestones: [one], goal: {} })).toBe('invalid-label');
    expect(codeOf({ milestones: [one], goal: 'but' })).toBe('invalid-data');
    expect(codeOf({ milestones: [one], goal: { label: 'x', href: 'http://a.fr' } })).toBe(
      'invalid-href',
    );
    expect(codeOf({ milestones: [one], goal: { label: 'x', date: '2027-99' } })).toBe(
      'invalid-date',
    );
  });

  it('ne porte jamais de badge', () => {
    expect(codeOf({ milestones: [one], goal: { label: 'x', badge: { src: '/a.webp' } } })).toBe(
      'invalid-badge',
    );
  });
});
