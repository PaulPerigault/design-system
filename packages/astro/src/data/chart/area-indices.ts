import type { Result } from '@paulperigault/dataviz';
import { lttb, ok } from '@paulperigault/dataviz';
import { MAX_POINTS_PER_SERIES } from './frame.ts';

type Column = readonly (number | null)[];

/**
 * Points au total pour toutes les couches : l'aire porte la description, des motifs et un tracé
 * par couche, donc moins de points que la courbe (`POINT_BUDGET`) pour tenir en 10 ko (ADR-0007).
 */
const AREA_POINT_BUDGET = 250;

/** Points par couche : 500 au plus (ADR-0007), le total partagé entre les couches. */
export const areaTarget = (layers: number): number =>
  Math.min(MAX_POINTS_PER_SERIES, Math.floor(AREA_POINT_BUDGET / Math.max(1, layers)));

/** Hauteur cumulée à la position `i` : la plus haute des couches présentes, `null` si aucune. */
function heightAt(tops: readonly Column[], i: number): number | null {
  const present = tops.flatMap((top) => top[i] ?? []);
  return present.length === 0 ? null : Math.max(...present);
}

/** Positions voisines d'un trou, dans n'importe quelle couche : elles gardent le trou visible. */
function aroundGaps(tops: readonly Column[], length: number): Set<number> {
  const kept = new Set<number>();
  for (let i = 0; i < length; i += 1) {
    if (tops.some((top) => top[i] === null)) [i - 1, i, i + 1].forEach((j) => kept.add(j));
  }
  return kept;
}

/**
 * Positions conservées, communes à toutes les couches (sinon l'empilement se décalerait) : toutes
 * sous la cible, sinon LTTB sur la hauteur cumulée, plus les bords de chaque trou.
 */
export function areaIndices(
  xs: readonly number[],
  tops: readonly Column[],
  target: number,
): Result<number[]> {
  const all = xs.map((_, i) => i);
  if (xs.length <= target) return ok(all);
  const kept = lttb(
    xs,
    all.map((i) => heightAt(tops, i)),
    target,
  );
  if (!kept.ok) return kept;
  const wanted = new Set([...kept.value, ...aroundGaps(tops, xs.length)]);
  return ok(all.filter((i) => wanted.has(i)));
}
