import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

const ascending = (a: number, b: number): number => a - b;

/** Valeurs triées par ordre croissant, ou l'erreur d'une suite vide ou non finie. */
function sortedFinite(values: readonly number[]): Result<readonly number[]> {
  if (values.length === 0) return fail('stats.empty', 'Aucune valeur.', 'values');
  if (!values.every(Number.isFinite)) {
    return fail('stats.non-finite', 'Toutes les valeurs doivent être finies.', 'values');
  }
  return ok([...values].sort(ascending));
}

const isProbability = (p: number): boolean => Number.isFinite(p) && p >= 0 && p <= 1;

/** Q(p) = (1 - γ) x[j] + γ x[j + 1], avec h = (n - 1) p, j = ⌊h⌋ et γ = h - j (suite triée). */
function atProbability(sorted: readonly number[], p: number): number {
  const position = (sorted.length - 1) * p;
  const below = Math.floor(position);
  const weight = position - below;
  const lower = sorted[below] ?? Number.NaN;
  const upper = sorted[Math.min(below + 1, sorted.length - 1)] ?? lower;
  return (1 - weight) * lower + weight * upper;
}

/**
 * Quantiles de type 7 (Hyndman et Fan, 1996, « Sample quantiles in statistical packages », The
 * American Statistician 50(4)), définition par défaut de R et de NumPy : interpolation linéaire
 * entre les deux valeurs triées qui encadrent la position (n - 1) p.
 * `stats.empty` si `values` est vide, `stats.non-finite` si une valeur n'est pas finie,
 * `stats.bad-probability` si une probabilité sort de [0, 1]. Les valeurs sont contrôlées d'abord.
 */
export function quantiles(
  values: readonly number[],
  probabilities: readonly number[],
): Result<readonly number[]> {
  const sorted = sortedFinite(values);
  if (!sorted.ok) return sorted;
  if (!probabilities.every(isProbability)) {
    return fail('stats.bad-probability', 'Une probabilité doit être dans [0, 1].', 'probabilities');
  }
  return ok(probabilities.map((p) => atProbability(sorted.value, p)));
}

/** Un seul quantile de type 7 ; voir `quantiles`. */
export function quantile(values: readonly number[], p: number): Result<number> {
  const result = quantiles(values, [p]);
  if (!result.ok) return result;
  return ok(result.value[0] ?? Number.NaN);
}
