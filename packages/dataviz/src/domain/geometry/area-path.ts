import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { coord } from './format.ts';
import type { PathPoint, Pixel } from './line-path.ts';
import { segmentsOf } from './line-path.ts';

export interface AreaGeometry {
  /** Attribut `d` : un sous-chemin fermé par segment continu d'au moins deux points. */
  readonly d: string;
  /** Points sans voisin : une aire d'un seul point n'a pas de surface, à marquer. */
  readonly isolated: readonly Pixel[];
}

/** Aire d'un segment : le contour de la courbe, puis la verticale et la base jusqu'au départ. */
function segmentArea(segment: readonly Pixel[], baseline: number): string {
  const first = segment[0];
  if (first === undefined) return '';
  const curve = segment.map((p, i) => `${i === 0 ? 'M' : 'L'}${coord(p.x)} ${coord(p.y)}`);
  return `${curve.join('')}V${coord(baseline)}H${coord(first.x)}z`;
}

/**
 * Aire sous une courbe jusqu'à la ligne de base (`baseline`, en pixels). Une valeur manquante
 * (`y = null`) rompt l'aire : chaque segment continu se ferme sur la base, rien n'est tracé au
 * travers du trou. `geometry.bad-input` si une coordonnée n'est pas finie.
 */
export function areaPath(points: readonly PathPoint[], baseline: number): Result<AreaGeometry> {
  const finite = points.every(
    ({ x, y }) => Number.isFinite(x) && (y === null || Number.isFinite(y)),
  );
  if (!finite || !Number.isFinite(baseline)) {
    return fail('geometry.bad-input', 'Coordonnée non finie.', 'points');
  }
  const segments = segmentsOf(points);
  return ok({
    d: segments
      .filter((s) => s.length > 1)
      .map((s) => segmentArea(s, baseline))
      .join(''),
    isolated: segments.flatMap((s) => (s.length === 1 && s[0] ? [s[0]] : [])),
  });
}
