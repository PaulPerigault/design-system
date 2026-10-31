import { describe, expect, it } from 'vitest';
import { groupByLabel } from '../src/domain/aggregate/groups.ts';
import { timeKey } from '../src/domain/aggregate/keys.ts';
import { reduceValues } from '../src/domain/aggregate/operations.ts';
import { checkSpec, OPERATIONS } from '../src/domain/aggregate/spec.ts';

describe('reduceValues', () => {
  const values = [4, -2, 7, 1];
  it('réduit dans l’ordre des données', () => {
    const expected = { sum: 10, mean: 2.5, min: -2, max: 7, count: 4, first: 4, last: 1 };
    for (const operation of OPERATIONS) {
      expect(reduceValues(operation, values), operation).toBe(expected[operation]);
    }
  });
  it('rend null sans valeur, jamais 0 ni NaN, count compris', () => {
    for (const operation of OPERATIONS) expect(reduceValues(operation, [])).toBeNull();
  });
  it('garde une valeur unique', () => {
    expect(reduceValues('mean', [3])).toBe(3);
    expect(reduceValues('last', [3])).toBe(3);
  });
});

describe('groupByLabel', () => {
  it('suit la première apparition et garde l’ordre des points', () => {
    const groups = groupByLabel(['b', 'a', 'b', 'c', 'a']);
    expect(groups.labels).toEqual(['b', 'a', 'c']);
    expect(groups.members).toEqual([[0, 2], [1, 4], [3]]);
  });
  it('rend un résultat vide pour une suite vide', () => {
    expect(groupByLabel([])).toEqual({ labels: [], members: [] });
  });
});

describe('timeKey', () => {
  const key = (by: 'day' | 'month' | 'year', text: string) => {
    const result = timeKey(by, text);
    return result.ok ? result.value : result.error.code;
  };
  it('tronque en UTC au jour, au mois ou à l’année', () => {
    expect(key('day', '2026-10-28T23:59:59Z')).toBe('2026-10-28');
    expect(key('month', '2026-10-28')).toBe('2026-10');
    expect(key('year', '2026-10-28T09:00Z')).toBe('2026');
  });
  it('prend le premier jour ou mois d’une date moins précise', () => {
    expect(key('day', '2026-10')).toBe('2026-10-01');
    expect(key('month', '2026')).toBe('2026-01');
  });
  it('refuse une date absente du calendrier', () => {
    expect(key('day', '2026-02-30')).toBe('dataset.bad-date');
    expect(key('day', '2025-02-29')).toBe('dataset.bad-date');
    expect(key('day', '2024-02-29')).toBe('2024-02-29');
    expect(key('year', 'demain')).toBe('dataset.bad-date');
    expect(key('year', '0050-01-01')).toBe('dataset.bad-date');
  });
});

describe('checkSpec', () => {
  it('accepte une spécification valide', () => {
    expect(checkSpec({ by: 'month', operation: 'sum' }).ok).toBe(true);
  });
  it('refuse une valeur inconnue ou absente, sans lever', () => {
    for (const spec of [{ by: 'week', operation: 'sum' }, { by: 'day' }, null, 'sum']) {
      const result = checkSpec(spec);
      expect(!result.ok && result.error.code).toBe('aggregate.bad-spec');
    }
  });
});
