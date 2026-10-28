import { PAIR } from '../numbers.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { Extent } from './linear.ts';

/** Échelle par bandes : `count` catégories de même largeur, séparées par `padding` (0 à 1). */
export interface BandScale {
  readonly count: number;
  readonly step: number;
  readonly bandwidth: number;
  /** Début de la bande `index`, du côté du début de l'étendue. */
  readonly start: (index: number) => number;
}

const validRange = (range: Extent, padding: number): boolean =>
  range.every(Number.isFinite) && padding >= 0 && padding < 1;

/**
 * Étendue décroissante admise (barres horizontales à l'envers) : la bande 0 reste alors
 * du côté du début de l'étendue. `scale.bad-domain` si `count` n'est pas un entier positif,
 * `scale.bad-range` si l'étendue n'est pas finie ou si le remplissage sort de [0 ; 1[.
 */
export function bandScale(count: number, range: Extent, padding = 0): Result<BandScale> {
  if (!Number.isInteger(count) || count < 0) {
    return fail('scale.bad-domain', `${count} catégories : entier positif attendu.`, 'count');
  }
  if (!validRange(range, padding)) {
    return fail('scale.bad-range', 'Étendue non finie ou remplissage hors [0 ; 1[.', 'range');
  }
  const [r0, r1] = range;
  const step = count === 0 ? 0 : Math.abs(r1 - r0) / count;
  const bandwidth = step * (1 - padding);
  const margin = (step - bandwidth) / PAIR;
  const forward = r1 >= r0;
  const origin = Math.min(r0, r1);
  return ok({
    count,
    step,
    bandwidth,
    start: (index) => origin + (forward ? index : count - 1 - index) * step + margin,
  });
}
