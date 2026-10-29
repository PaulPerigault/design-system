import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { coord } from './format.ts';

/** Point en pixels ; `y = null` marque une donnée manquante qui interrompt la courbe. */
export interface PathPoint {
  readonly x: number;
  readonly y: number | null;
}

export interface LineGeometry {
  /** Attribut `d` : un `M` par segment continu ; chaîne vide si aucun segment. */
  readonly d: string;
  /** Points sans voisin (segment d'un seul point) : le tracé n'en dessine rien, à marquer. */
  readonly isolated: readonly { readonly x: number; readonly y: number }[];
}

export type Pixel = { readonly x: number; readonly y: number };

export function segmentsOf(points: readonly PathPoint[]): Pixel[][] {
  const segments: Pixel[][] = [];
  let current: Pixel[] = [];
  for (const { x, y } of points) {
    if (y === null) {
      if (current.length > 0) segments.push(current);
      current = [];
    } else current.push({ x, y });
  }
  return current.length > 0 ? [...segments, current] : segments;
}

/** Chemin d'une courbe en segments droits, interrompu à chaque valeur manquante. */
export function linePath(points: readonly PathPoint[]): Result<LineGeometry> {
  if (points.some(({ x, y }) => !Number.isFinite(x) || (y !== null && !Number.isFinite(y)))) {
    return fail('geometry.bad-input', 'Coordonnée non finie.', 'points');
  }
  const segments = segmentsOf(points);
  const d = segments
    .filter((segment) => segment.length > 1)
    .map((segment) =>
      segment.map((p, i) => `${i === 0 ? 'M' : 'L'}${coord(p.x)} ${coord(p.y)}`).join(''),
    )
    .join('');
  return ok({ d, isolated: segments.flatMap((s) => (s.length === 1 && s[0] ? [s[0]] : [])) });
}
