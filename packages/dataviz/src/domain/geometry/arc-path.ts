import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import { coord } from './format.ts';

/** Angles en degrés : 0 en haut (midi), croissants dans le sens horaire. */
export const HALF_TURN = 180;
export const FULL_TURN = 360;
const RADIANS = Math.PI / HALF_TURN;

export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface Radii {
  readonly inner: number;
  readonly outer: number;
}
export interface AngleSpan {
  readonly from: number;
  readonly to: number;
}

/** Point d'un cercle de centre `c` et de rayon `r`, à l'angle `angle` (0 en haut, sens horaire). */
export const polar = (c: Point, r: number, angle: number): Point => ({
  x: c.x + r * Math.sin(angle * RADIANS),
  y: c.y - r * Math.cos(angle * RADIANS),
});

const at = (p: Point): string => `${coord(p.x)} ${coord(p.y)}`;
const arc = (r: number, large: number, clockwise: number, to: Point): string =>
  `A${coord(r)} ${coord(r)} 0 ${large} ${clockwise} ${at(to)}`;

/** Un cercle en deux demi-arcs, à partir de l'angle `start`. */
function circle(c: Point, r: number, start: number, clockwise: number): string {
  const [p0, p1] = [polar(c, r, start), polar(c, r, start + HALF_TURN)];
  return `M${at(p0)}${arc(r, 0, clockwise, p1)}${arc(r, 0, clockwise, p0)}z`;
}

/**
 * Secteur d'anneau entre deux rayons et deux angles (`to` > `from`), fermé. Un secteur d'un tour
 * entier (ou plus) devient un anneau : le cercle intérieur, de sens inverse, évide le disque.
 * `geometry.bad-input` pour un centre, un rayon ou un angle non fini, des rayons inversés, ou un
 * secteur sans ouverture.
 */
export function sectorPath(c: Point, radii: Radii, span: AngleSpan): Result<string> {
  const values = [c.x, c.y, radii.inner, radii.outer, span.from, span.to];
  if (!values.every(Number.isFinite) || radii.inner < 0 || radii.outer <= radii.inner) {
    return fail('geometry.bad-input', 'Rayons ou angles invalides.', 'sector');
  }
  const sweep = span.to - span.from;
  if (sweep <= 0) return fail('geometry.bad-input', 'Secteur sans ouverture.', 'sector');
  if (sweep >= FULL_TURN) {
    return ok(circle(c, radii.outer, span.from, 1) + circle(c, radii.inner, span.from, 0));
  }
  const large = sweep > HALF_TURN ? 1 : 0;
  const [o1, i0] = [polar(c, radii.outer, span.to), polar(c, radii.inner, span.from)];
  const start = polar(c, radii.outer, span.from);
  const back = polar(c, radii.inner, span.to);
  return ok(
    `M${at(start)}${arc(radii.outer, large, 1, o1)}L${at(back)}${arc(radii.inner, large, 0, i0)}z`,
  );
}

/** Trait radial (aiguille ou repère de valeur) entre deux rayons, à l'angle donné. */
export function radialLine(c: Point, radii: Radii, angle: number): Result<string> {
  if (![c.x, c.y, radii.inner, radii.outer, angle].every(Number.isFinite)) {
    return fail('geometry.bad-input', 'Rayons ou angle invalides.', 'needle');
  }
  return ok(`M${at(polar(c, radii.inner, angle))}L${at(polar(c, radii.outer, angle))}`);
}
