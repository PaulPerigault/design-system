import { describe, expect, it } from 'vitest';
import { parseIsoDate } from '../src/domain/iso-date.ts';
import {
  MAX_BAR_CATEGORIES,
  checkBarCategories,
  checkSeriesCount,
  checkSharedUnit,
} from '../src/domain/limits.ts';
import { parseDataset } from '../src/infrastructure/parse-dataset.ts';
import { valid } from './fixtures.ts';

describe('parseIsoDate', () => {
  it.each(['2026', '2026-10', '2026-10-28', '2026-10-28T09:00Z', '2026-10-28T09:00:30Z'])(
    '%s est valide',
    (text) => {
      expect(parseIsoDate(text).ok).toBe(true);
    },
  );

  it('calcule l’instant UTC', () => {
    const date = parseIsoDate('2026-10-28T09:00:00Z');
    expect(date.ok && date.value).toBe(Date.UTC(2026, 9, 28, 9));
  });

  it.each(['2026-13', '2026-02-30', '28/10/2026', '2026-10-28T25:00Z', '2026-10-28T09:00', ''])(
    '« %s » est refusée',
    (text) => {
      const result = parseIsoDate(text);
      expect(!result.ok && result.error.code).toBe('dataset.bad-date');
    },
  );
});

describe('limites de graphique', () => {
  const series = Array.from({ length: 7 }, (_, index) => ({
    id: `s${index}`,
    label: '',
    unit: '',
    values: [1],
  }));
  const x = { kind: 'category' as const, label: '', values: ['a'] };

  it('refuse plus de 6 séries', () => {
    const result = checkSeriesCount({ schema: 1, x, series });
    expect(!result.ok && result.error.code).toBe('chart.too-many-series');
    expect(checkSeriesCount({ schema: 1, x, series: series.slice(0, 6) }).ok).toBe(true);
  });

  it('refuse deux unités sur un même axe', () => {
    const mixed = parseDataset(valid);
    if (!mixed.ok) throw new Error('jeu invalide');
    const result = checkSharedUnit(mixed.value);
    expect(!result.ok && result.error.code).toBe('dataset.unit-mismatch');
  });

  it('refuse plus de 40 catégories de barres, avec le conseil', () => {
    const categories = (count: number) => ({
      schema: 1 as const,
      x: {
        kind: 'category' as const,
        label: '',
        values: Array.from({ length: count }, (_, i) => `c${i}`),
      },
      series: [{ id: 'a', label: '', unit: '', values: Array.from({ length: count }, () => 1) }],
    });
    const result = checkBarCategories(categories(MAX_BAR_CATEGORIES + 1));
    expect(!result.ok && result.error.code).toBe('bar.too-many-categories');
    expect(!result.ok && result.error.message).toContain('courbe');
    expect(!result.ok && result.error.path).toBe('x.values');
    expect(checkBarCategories(categories(MAX_BAR_CATEGORIES)).ok).toBe(true);
  });
});
