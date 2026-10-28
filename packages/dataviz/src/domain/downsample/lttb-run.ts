import { PAIR } from '../numbers.ts';

export interface Point {
  readonly x: number;
  readonly y: number;
}

interface Pick {
  readonly index: number;
  readonly point: Point;
  readonly area: number;
}

const area = (a: Point, b: Point, c: Point): number =>
  Math.abs((a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y));

const average = (points: readonly Point[]): Point => ({
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
});

/** Point du seau [from ; to[ dont le triangle avec `previous` et `next` est le plus grand. */
function pickInBucket(
  points: readonly Point[],
  bounds: readonly [number, number],
  triangle: readonly [Point, Point],
): Pick {
  const [from, to] = bounds;
  let best: Pick = { index: from, point: triangle[0], area: -1 };
  for (const [offset, point] of points.slice(from, to).entries()) {
    const current = area(triangle[0], point, triangle[1]);
    if (current > best.area) best = { index: from + offset, point, area: current };
  }
  return best;
}

/**
 * LTTB (Steinarsson, 2013) sur une suite sans trou : indices retenus, premier et dernier compris.
 * `quota` ≥ 2 ; au-delà de la longueur, tous les points sont gardés.
 */
export function lttbRun(points: readonly Point[], quota: number): readonly number[] {
  const count = points.length;
  const first = points[0];
  const last = points[count - 1];
  if (quota >= count || count <= PAIR || first === undefined || last === undefined) {
    return points.map((_, index) => index);
  }
  const buckets = quota - PAIR;
  const every = (count - PAIR) / buckets;
  const kept = [0];
  let previous = first;
  for (let bucket = 0; bucket < buckets; bucket += 1) {
    const from = Math.floor(bucket * every) + 1;
    const to = Math.floor((bucket + 1) * every) + 1;
    const after = Math.min(Math.floor((bucket + PAIR) * every) + 1, count);
    const next = bucket === buckets - 1 ? last : average(points.slice(to, after));
    const pick = pickInBucket(points, [from, to], [previous, next]);
    kept.push(pick.index);
    previous = pick.point;
  }
  return [...kept, count - 1];
}
