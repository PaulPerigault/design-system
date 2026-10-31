import { describe, expect, it } from 'vitest';
import { createAggregator } from '../src/application/aggregator.ts';
import type { Dataset } from '../src/domain/dataset.ts';
import type { AggregateSpec } from '../src/domain/aggregate/spec.ts';

const series = (rows: (number | null)[][]) =>
  rows.map((values, i) => ({ id: `s${i}`, label: `S${i}`, unit: '€', values }));
const category = (x: string[], ...rows: (number | null)[][]): Dataset => ({
  schema: 1,
  x: { kind: 'category', label: 'x', values: x },
  series: series(rows),
});
const time = (x: string[], ...rows: (number | null)[][]): Dataset => ({
  schema: 1,
  x: { kind: 'time', label: 'x', values: x },
  series: series(rows),
});
const numeric = (x: number[], ...rows: (number | null)[][]): Dataset => ({
  schema: 1,
  x: { kind: 'number', label: 'x', values: x },
  series: series(rows),
});

const { aggregate } = createAggregator();
const run = (data: Dataset, spec: AggregateSpec) => aggregate(data, spec);
const code = (data: Dataset, spec: AggregateSpec) => {
  const result = run(data, spec);
  return result.ok ? 'ok' : result.error.code;
};

describe('aggregate par catégorie', () => {
  const data = category(['b', 'a', 'b', 'c'], [1, null, 4, null], [2, 3, 5, 7]);
  it('suit la première apparition, garde le null d’un groupe sans valeur', () => {
    const result = run(data, { by: 'category', operation: 'sum' });
    expect(result).toMatchObject({
      ok: true,
      value: {
        x: { kind: 'category', values: ['b', 'a', 'c'] },
        series: [{ values: [5, null, null] }, { values: [7, 3, 7] }],
      },
    });
  });
  it('count ne compte que les valeurs non nulles et perd l’unité', () => {
    const result = run(data, { by: 'category', operation: 'count' });
    expect(result).toMatchObject({
      ok: true,
      value: { series: [{ unit: '', values: [2, null, null] }, { values: [2, 1, 1] }] },
    });
  });
  it('first et last suivent l’ordre des données', () => {
    const first = run(data, { by: 'category', operation: 'first' });
    const last = run(data, { by: 'category', operation: 'last' });
    expect(first.ok && first.value.series[1]?.values).toEqual([2, 3, 7]);
    expect(last.ok && last.value.series[1]?.values).toEqual([5, 3, 7]);
  });
});

describe('aggregate par pas de temps', () => {
  const data = time(['2026-01-05', '2026-01-20', '2026-02-01'], [1, 2, 3]);
  it('groupe par mois en UTC', () => {
    expect(run(data, { by: 'month', operation: 'mean' })).toMatchObject({
      ok: true,
      value: {
        x: { kind: 'time', values: ['2026-01', '2026-02'] },
        series: [{ values: [1.5, 3] }],
      },
    });
  });
});

describe('erreurs typées, sans levée', () => {
  const spec: AggregateSpec = { by: 'category', operation: 'sum' };
  it('refuse un axe qui ne convient pas', () => {
    expect(code(numeric([1, 2], [1, 2]), spec)).toBe('aggregate.bad-axis');
    expect(code(category(['a'], [1]), { by: 'day', operation: 'sum' })).toBe('aggregate.bad-axis');
  });
  it('refuse une spécification inconnue', () => {
    const bad: AggregateSpec = JSON.parse('{"by":"week","operation":"sum"}');
    expect(code(category(['a'], [1]), bad)).toBe('aggregate.bad-spec');
  });
  it('refuse vide, longueurs différentes, valeur non finie, date inexistante', () => {
    expect(code(category([], []), spec)).toBe('dataset.empty');
    expect(code(category(['a']), spec)).toBe('dataset.empty');
    expect(code(category(['a', 'b'], [1]), spec)).toBe('dataset.length-mismatch');
    expect(code(category(['a', 'b'], [1, Number.NaN]), spec)).toBe('dataset.non-finite');
    expect(code(category(['a'], [Infinity]), spec)).toBe('dataset.non-finite');
    expect(code(time(['2026-13-01'], [1]), { by: 'day', operation: 'sum' })).toBe(
      'dataset.bad-date',
    );
  });
  it('contrôle la forme avant les valeurs finies', () => {
    expect(code(category(['a', 'b'], [Number.NaN], [1, 2]), spec)).toBe('dataset.length-mismatch');
  });
});
