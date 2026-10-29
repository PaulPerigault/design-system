import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

type Column = readonly (number | null)[];

/** Une couche empilée : bornes cumulées par position, `null` là où la couche n'a pas de donnée. */
export interface StackLayer {
  /** Haut de la couche d'en dessous (zéro pour la première). */
  readonly lower: Column;
  readonly upper: Column;
}

function firstInvalid(values: Column, layer: number): Result<never> | undefined {
  for (const [index, value] of values.entries()) {
    if (value === null) continue;
    const path = `series[${layer}].values[${index}]`;
    if (!Number.isFinite(value)) return fail('geometry.bad-input', 'Valeur non finie.', path);
    if (value < 0) {
      return fail('stack.negative-value', 'Un empilement n’accepte que des positives.', path);
    }
  }
  return undefined;
}

/**
 * Empile des séries : chaque couche repose sur le cumul de celles d'en dessous. Une valeur
 * manquante compte pour zéro dans le cumul (les couches au-dessus descendent d'autant) mais rompt
 * sa propre couche : `lower` et `upper` y valent `null`, le vide se voit et ne se déguise pas en
 * zéro. `stack.negative-value` si une valeur est négative (un empilement signé se lit mal).
 */
export function stackSeries(series: readonly Column[]): Result<readonly StackLayer[]> {
  const length = series[0]?.length ?? 0;
  if (series.some((values) => values.length !== length)) {
    return fail('geometry.bad-input', 'Chaque série doit avoir la même longueur.', 'series');
  }
  const totals = Array.from({ length }, () => 0);
  const layers: StackLayer[] = [];
  for (const [layer, values] of series.entries()) {
    const invalid = firstInvalid(values, layer);
    if (invalid) return invalid;
    const lower = values.map((value, i) => (value === null ? null : (totals[i] ?? 0)));
    values.forEach((value, i) => {
      totals[i] = (totals[i] ?? 0) + (value ?? 0);
    });
    const upper = values.map((value, i) => (value === null ? null : (totals[i] ?? 0)));
    layers.push({ lower, upper });
  }
  return ok(layers);
}
