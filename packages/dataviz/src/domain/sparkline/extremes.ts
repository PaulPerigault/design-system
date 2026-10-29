export interface Extremum {
  readonly index: number;
  readonly value: number;
}

export interface Extremes {
  readonly min: Extremum;
  readonly max: Extremum;
}

/** Minimum et maximum d'une série, première occurrence en cas d'égalité ; `null` sans valeur. */
const lower = (value: number, best: Extremum | null): boolean =>
  best === null || value < best.value;
const higher = (value: number, best: Extremum | null): boolean =>
  best === null || value > best.value;

/** Minimum et maximum d'une série, première occurrence en cas d'égalité ;  sans valeur. */
export function extremesOf(values: readonly (number | null)[]): Extremes | null {
  let min: Extremum | null = null;
  let max: Extremum | null = null;
  for (const [index, value] of values.entries()) {
    if (value === null) continue;
    if (lower(value, min)) min = { index, value };
    if (higher(value, max)) max = { index, value };
  }
  return min === null || max === null ? null : { min, max };
}
