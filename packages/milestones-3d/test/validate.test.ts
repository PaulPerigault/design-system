import { describe, expect, it } from 'vitest';
import { validateData } from '../src/validate.ts';
import { codeOf, one } from './support-validate.ts';

const many = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ ...one, id: `m${index}` }));

describe('bornes', () => {
  it('accepte 1 jalon et 24 jalons', () => {
    expect(validateData({ milestones: many(1) }).milestones).toHaveLength(1);
    expect(validateData({ milestones: many(24) }).milestones).toHaveLength(24);
  });

  it('refuse 0 et 25 jalons avec le nombre trouvé', () => {
    expect(codeOf({ milestones: [] })).toBe('milestone-count');
    expect(codeOf({ milestones: many(25) })).toBe('milestone-count');
    expect(() => validateData({ milestones: many(25) })).toThrow(/25/);
  });

  it('refuse ce qui n’est pas un objet avec un tableau', () => {
    for (const input of [
      undefined,
      null,
      'x',
      3,
      [],
      {},
      { milestones: 'a' },
      { milestones: {} },
    ]) {
      expect(codeOf(input), String(input)).toBe('invalid-data');
    }
  });
});

describe('champs d’un jalon', () => {
  it('identifiant : [a-z0-9-]+, unique', () => {
    for (const id of ['A', 'a b', 'a_b', '', 'é', 'a.b']) {
      expect(codeOf({ milestones: [{ ...one, id }] }), id).toMatch(/invalid-(id|label)/);
    }
    expect(codeOf({ milestones: [one, one] })).toBe('duplicate-id');
  });

  it('libellé requis, non vide', () => {
    expect(codeOf({ milestones: [{ id: 'a', status: 'planned' }] })).toBe('invalid-label');
    expect(codeOf({ milestones: [{ ...one, label: '  ' }] })).toBe('invalid-label');
    expect(codeOf({ milestones: [{ ...one, label: 4 }] })).toBe('invalid-label');
  });

  it('statut : achieved ou planned, rien d’autre', () => {
    expect(codeOf({ milestones: [{ ...one, status: 'done' }] })).toBe('unknown-status');
    expect(codeOf({ milestones: [{ id: 'a', label: 'x' }] })).toBe('unknown-status');
  });

  it('le code est un texte simple de 16 caractères au plus', () => {
    const ok = (code: string) => codeOf({ milestones: [{ ...one, code }] });
    expect(ok('SAA-C03')).toBeUndefined();
    expect(ok('a'.repeat(16))).toBeUndefined();
    expect(ok('a'.repeat(17))).toBe('invalid-code');
    expect(ok('a\nb')).toBe('invalid-code');
    expect(ok('  ')).toBe('invalid-label');
    expect(codeOf({ milestones: [{ ...one, code: 4 }] })).toBe('invalid-label');
    expect(() => validateData({ milestones: [{ ...one, code: 'x'.repeat(20) }] })).toThrow(
      /invalid-code.*milestones\[0\]\.code/,
    );
  });

  it('les anciens emblèmes ne sont plus un champ du contrat', () => {
    const data = validateData({ milestones: [{ ...one, emblem: 'key' }] });
    expect(data.milestones[0]).not.toHaveProperty('emblem');
  });

  it('dates : AAAA-MM ou AAAA-MM-JJ, mois et jour qui existent', () => {
    for (const date of ['2026-02', '2026-02-28', '2024-02-29']) {
      expect(codeOf({ milestones: [{ ...one, date }] }), date).toBeUndefined();
    }
    for (const date of ['2026', '2026-13', '2026-02-30', '2025-02-29', '26-02', '2026-2-1', 'x']) {
      expect(codeOf({ milestones: [{ ...one, date }] }), date).toBe('invalid-date');
    }
  });

  it('conserve l’ordre donné, sans trier par date', () => {
    const list = [
      { ...one, id: 'z', date: '2027-01' },
      { ...one, id: 'y', date: '2020-01' },
      { ...one, id: 'x' },
    ];
    expect(validateData({ milestones: list }).milestones.map((m) => m.id)).toEqual(['z', 'y', 'x']);
  });

  it('date et lien invalides disent où', () => {
    expect(() => validateData({ milestones: [{ ...one, date: '2026-13' }] })).toThrow(
      /invalid-date.*milestones\[0\]\.date/,
    );
    expect(() =>
      validateData({ milestones: [one, { ...one, id: 'b', href: 'javascript:alert(1)' }] }),
    ).toThrow(/invalid-href.*milestones\[1\]\.href/);
  });

  it('rend une copie propre : champs facultatifs absents, aucun champ inconnu', () => {
    const data = validateData({ milestones: [{ ...one, extra: 1, group: 'Émetteur' }], other: 2 });
    expect(data).toEqual({
      milestones: [{ id: 'a', label: 'Un', status: 'achieved', group: 'Émetteur' }],
    });
    expect(Object.keys(data.milestones[0] ?? {})).not.toContain('date');
  });
});
