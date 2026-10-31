import type { Operation } from './spec.ts';

type Reducer = (values: readonly [number, ...number[]]) => number;

const sum: Reducer = (values) => values.reduce((total, value) => total + value, 0);

/** Plus petite valeur : `<` strict, donc la première en cas d'égalité (ordre des données). */
const smallest: Reducer = (values) => values.reduce((best, value) => (value < best ? value : best));
const largest: Reducer = (values) => values.reduce((best, value) => (value > best ? value : best));

const REDUCERS: Readonly<Record<Operation, Reducer>> = {
  sum,
  mean: (values) => sum(values) / values.length,
  min: smallest,
  max: largest,
  count: (values) => values.length,
  first: (values) => values[0],
  last: (values) => values[values.length - 1] ?? values[0],
};

/**
 * Réduit les valeurs non manquantes d'un groupe, dans l'ordre des données. Sans valeur : `null`,
 * jamais `0` ni `NaN` (ADR-0007), `count` compris. La somme part de 0 et ajoute dans l'ordre.
 */
export function reduceValues(operation: Operation, values: readonly number[]): number | null {
  const [head, ...rest] = values;
  return head === undefined ? null : REDUCERS[operation]([head, ...rest]);
}
