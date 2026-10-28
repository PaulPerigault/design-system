import type { Result } from '../result.ts';
import { PAIR } from '../numbers.ts';
import { fail, ok } from '../result.ts';

export type Extent = readonly [number, number];

/** Échelle linéaire : `map` envoie le domaine sur l'étendue, `invert` fait l'inverse. */
export interface LinearScale {
  readonly domain: Extent;
  readonly range: Extent;
  readonly map: (value: number) => number;
  readonly invert: (pixel: number) => number;
}

const finite = (extent: Extent): boolean => extent.every(Number.isFinite);

/**
 * Domaine confondu (valeurs identiques) : toute valeur tombe au milieu de l'étendue.
 * `scale.bad-domain` ou `scale.bad-range` si un bout n'est pas fini.
 */
export function linearScale(domain: Extent, range: Extent): Result<LinearScale> {
  if (!finite(domain)) return fail('scale.bad-domain', 'Domaine non fini.', 'domain');
  if (!finite(range)) return fail('scale.bad-range', 'Étendue non finie.', 'range');
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const middle = (r0 + r1) / PAIR;
  return ok({
    domain,
    range,
    map: (value) => (span === 0 ? middle : r0 + ((value - d0) / span) * (r1 - r0)),
    invert: (pixel) => (r1 === r0 ? d0 : d0 + ((pixel - r0) / (r1 - r0)) * span),
  });
}

/** Axe Y SVG : l'origine est en haut, le minimum du domaine part donc en bas (`height`). */
export const verticalScale = (domain: Extent, height: number): Result<LinearScale> =>
  linearScale(domain, [height, 0]);
