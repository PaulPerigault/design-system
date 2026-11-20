import { describe, expect, it } from 'vitest';
import { MilestonesError } from '../src/error.ts';
import type { ErrorCode } from '../src/error.ts';
import { validateData } from '../src/validate.ts';

const one = { id: 'a', label: 'Un', status: 'achieved' };
const many = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ ...one, id: `m${index}` }));

function codeOf(input: unknown): ErrorCode | undefined {
  try {
    validateData(input);
  } catch (error) {
    return error instanceof MilestonesError ? error.code : undefined;
  }
  return undefined;
}

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

  it('emblème : clé du jeu fermé, ou absent', () => {
    for (const emblem of [
      'disc',
      'check',
      'shield',
      'cloud',
      'network',
      'database',
      'code',
      'key',
      'gear',
    ]) {
      expect(codeOf({ milestones: [{ ...one, emblem }] }), emblem).toBeUndefined();
    }
    expect(codeOf({ milestones: [{ ...one, emblem: 'star' }] })).toBe('unknown-emblem');
    expect(codeOf({ milestones: [{ ...one, emblem: 3 }] })).toBe('unknown-emblem');
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

describe('cible finale', () => {
  it('facultative, avec libellé et lien facultatif', () => {
    const goal = validateData({ milestones: [one], goal: { label: 'But', href: '/but' } }).goal;
    expect(goal).toEqual({ label: 'But', href: '/but' });
    expect(validateData({ milestones: [one] })).not.toHaveProperty('goal');
  });

  it('refuse une cible sans libellé ou avec un lien invalide', () => {
    expect(codeOf({ milestones: [one], goal: {} })).toBe('invalid-label');
    expect(codeOf({ milestones: [one], goal: 'but' })).toBe('invalid-data');
    expect(codeOf({ milestones: [one], goal: { label: 'x', href: 'http://a.fr' } })).toBe(
      'invalid-href',
    );
  });
});
