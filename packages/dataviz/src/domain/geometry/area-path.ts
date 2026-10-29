import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { coord } from './format.ts';
import type { PathPoint, Pixel } from './line-path.ts';
import { segmentsOf } from './line-path.ts';
import { relativeCurve, round1 } from './relative-curve.ts';

export interface AreaGeometry {
  /** Attribut `d` : un sous-chemin fermé par segment continu d'au moins deux points. */
  readonly d: string;
  /** Contour supérieur seul : la courbe de chaque segment, sans la verticale ni la base. */
  readonly top: string;
  /** Points sans voisin : une aire d'un seul point n'a pas de surface, à marquer. */
  readonly isolated: readonly Pixel[];
}

/** Aire d'un segment : la courbe (relative, 1 décimale), puis la verticale et la base jusqu'au départ. */
function segmentArea(segment: readonly Pixel[], baseline: number): string {
  const first = segment[0];
  if (first === undefined) return '';
  return `${relativeCurve(segment)}V${coord(baseline)}H${round1(first.x)}z`;
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
  const drawn = segments.filter((s) => s.length > 1);
  return ok({
    d: drawn.map((s) => segmentArea(s, baseline)).join(''),
    top: drawn.map(relativeCurve).join(''),
    isolated: segments.flatMap((s) => (s.length === 1 && s[0] ? [s[0]] : [])),
  });
}
