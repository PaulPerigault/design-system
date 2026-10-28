import { describe, expect, it } from 'vitest';
import { MAX_POINTS } from '../src/domain/dataset.ts';
import { ERROR_CODES } from '../src/errors.ts';
import { parseDataset } from '../src/infrastructure/parse-dataset.ts';
import { valid } from './fixtures.ts';

const codeOf = (input: unknown): string | undefined => {
  const result = parseDataset(input);
  return result.ok ? undefined : result.error.code;
};

describe('parseDataset : jeu valide', () => {
  it('garde les manquants à null, les unités et les libellés', () => {
    const result = parseDataset(valid);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.series[0]?.values).toEqual([1200.5, null, 980]);
    expect(result.value.series[1]?.label).toBe('marge');
    expect(result.value.series[0]?.unit).toBe('€');
  });

  it('accepte les axes category et number', () => {
    const category = { ...valid, x: { kind: 'category', values: ['a', 'b', 'c'] } };
    const number = { ...valid, x: { kind: 'number', values: [1, 2, 3] } };
    expect(parseDataset(category).ok && parseDataset(number).ok).toBe(true);
  });
});

describe('parseDataset : erreurs typées', () => {
  const withX = (x: unknown) => ({ ...valid, x });
  const withSeries = (series: unknown) => ({ ...valid, series });
  const cases: [string, unknown, string][] = [
    ['entrée non objet', 42, 'dataset.bad-shape'],
    ['schéma inconnu', { ...valid, schema: 2 }, 'dataset.bad-shape'],
    ['axe sans valeurs', withX({ kind: 'time' }), 'dataset.bad-shape'],
    ['axe de genre inconnu', withX({ kind: 'polar', values: [] }), 'dataset.bad-shape'],
    ['axe vide', withX({ kind: 'category', values: [] }), 'dataset.empty'],
    ['catégorie non texte', withX({ kind: 'category', values: [1, 2, 3] }), 'dataset.bad-shape'],
    ['date inexistante', withX({ kind: 'time', values: ['2026-02-30'] }), 'dataset.bad-date'],
    [
      'axe numérique infini',
      withX({ kind: 'number', values: [1, Infinity] }),
      'dataset.non-finite',
    ],
    ['aucune série', withSeries([]), 'dataset.empty'],
    ['séries non liste', withSeries({}), 'dataset.bad-shape'],
    ['série sans id', withSeries([{ values: [1, 2, 3] }]), 'dataset.bad-shape'],
    ['NaN', withSeries([{ id: 'a', values: [1, Number.NaN, 3] }]), 'dataset.non-finite'],
    [
      'texte dans les valeurs',
      withSeries([{ id: 'a', values: [1, '2', 3] }]),
      'dataset.non-finite',
    ],
    ['longueur différente', withSeries([{ id: 'a', values: [1, 2] }]), 'dataset.length-mismatch'],
    [
      'id en double',
      withSeries([
        { id: 'a', values: [1, 2, 3] },
        { id: 'a', values: [1, 2, 3] },
      ]),
      'dataset.duplicate-id',
    ],
  ];
  it.each(cases)('%s → %s', (_name, input, code) => {
    expect(codeOf(input)).toBe(code);
    expect(ERROR_CODES).toContain(code);
  });

  it('refuse trop de points', () => {
    const values = Array.from({ length: MAX_POINTS + 1 }, (_, index) => String(index));
    const series = [{ id: 'a', values: values.map(Number) }];
    expect(codeOf({ schema: 1, x: { kind: 'category', values }, series })).toBe(
      'dataset.too-many-points',
    );
  });

  it('indique le chemin de la valeur fautive', () => {
    const result = parseDataset({ ...valid, series: [{ id: 'a', values: [1, 2, Infinity] }] });
    expect(!result.ok && result.error.path).toBe('series[0].values[2]');
  });
});
