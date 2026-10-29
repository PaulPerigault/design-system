import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

export type Direction = 'up' | 'down' | 'flat';

export interface Variation {
  readonly direction: Direction;
  /** `valeur - référence`, signée. */
  readonly absolute: number;
  /** `absolue / |référence|` (fraction, 0,05 = 5 %) ; `null` si la référence est nulle. */
  readonly relative: number | null;
}

export function directionOf(delta: number): Direction {
  if (delta > 0) return 'up';
  return delta < 0 ? 'down' : 'flat';
}

/**
 * Variation d'une valeur par rapport à une référence. Référence absente (`null`) : pas de
 * variation, `ok(null)`. Référence nulle : la variation absolue existe, la relative est `null`
 * (division par zéro évitée). Le sens suit le signe de la variation absolue, y compris pour une
 * référence négative. `kpi.bad-value` ou `kpi.bad-reference` si un nombre n'est pas fini.
 */
export function variation(value: number, reference: number | null): Result<Variation | null> {
  if (!Number.isFinite(value)) {
    return fail('kpi.bad-value', 'Valeur non finie : fournissez un nombre fini.', 'value');
  }
  if (reference === null) return ok(null);
  if (!Number.isFinite(reference)) {
    return fail(
      'kpi.bad-reference',
      'Référence non finie : fournissez un nombre fini, ou `null` sans comparaison.',
      'reference',
    );
  }
  const absolute = value - reference;
  return ok({
    direction: directionOf(absolute),
    absolute,
    relative: reference === 0 ? null : absolute / Math.abs(reference),
  });
}
