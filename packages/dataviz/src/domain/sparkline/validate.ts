import { MAX_POINTS } from '../dataset.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { PAIR } from '../numbers.ts';

export interface SparklineInput {
  /** Série ; `null` = donnée manquante, qui rompt le tracé. */
  readonly values: readonly (number | null)[];
  /** Abscisses strictement croissantes ; par défaut l'indice de chaque valeur. */
  readonly xs?: readonly number[];
  readonly width: number;
  readonly height: number;
  /** Marge intérieure en unités du viewBox, pour que le trait et les marques ne soient pas coupés. */
  readonly padding?: number;
}

export interface CheckedSparkline {
  readonly values: readonly (number | null)[];
  readonly xs: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

const DEFAULT_PADDING = 2;

const increasing = (xs: readonly number[]): boolean =>
  xs.every((x, i) => i === 0 || x > (xs[i - 1] ?? x));

function checkSize({ width, height, padding = DEFAULT_PADDING }: SparklineInput): Result<number> {
  const positive = [width, height].every((side) => Number.isFinite(side) && side > 0);
  if (!positive || !Number.isFinite(padding) || padding < 0) {
    return fail('sparkline.bad-size', 'Largeur, hauteur > 0 et marge ≥ 0, nombres finis.', 'size');
  }
  if (padding * PAIR >= Math.min(width, height)) {
    return fail(
      'sparkline.bad-size',
      'Marge trop grande : réduisez-la sous la moitié du côté.',
      'padding',
    );
  }
  return ok(padding);
}

function checkValues(values: readonly (number | null)[]): Result<null> {
  if (values.length > MAX_POINTS) {
    return fail('dataset.too-many-points', 'Trop de points : agrégez la série.', 'values');
  }
  if (values.some((value) => value !== null && !Number.isFinite(value))) {
    return fail(
      'dataset.non-finite',
      'Valeur non finie : utilisez null pour une donnée manquante.',
      'values',
    );
  }
  if (values.every((value) => value === null)) {
    return fail('sparkline.no-data', 'Aucune valeur à tracer : affichez un EmptyState.', 'values');
  }
  return ok(null);
}

function checkAbscissas(xs: readonly number[], length: number): Result<null> {
  if (xs.length !== length) {
    return fail('dataset.length-mismatch', 'xs et values : même longueur.', 'xs');
  }
  if (!xs.every(Number.isFinite) || !increasing(xs)) {
    return fail('geometry.bad-input', 'Abscisses finies et strictement croissantes.', 'xs');
  }
  return ok(null);
}

/**
 * Valide l'entrée d'une sparkline. `sparkline.bad-size` (dimensions, marge), `sparkline.no-data`
 * (aucune valeur non nulle : afficher `EmptyState`), `dataset.too-many-points`,
 * `dataset.non-finite`, `dataset.length-mismatch`, `geometry.bad-input` (abscisses non croissantes).
 */
export function validateSparkline(input: SparklineInput): Result<CheckedSparkline> {
  const { values, width, height } = input;
  const padding = checkSize(input);
  if (!padding.ok) return padding;
  const valid = checkValues(values);
  if (!valid.ok) return valid;
  const xs = input.xs ?? values.map((_, index) => index);
  const aligned = checkAbscissas(xs, values.length);
  if (!aligned.ok) return aligned;
  return ok({ values, xs, width, height, padding: padding.value });
}
