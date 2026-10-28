import type { Axis, Formatter, Series } from '@paulperigault/dataviz';

const MISSING_ONE = 'donnée manquante';
const MISSING_MANY = 'données manquantes';

/** Libellé d'une abscisse : date en toutes lettres, nombre formaté ou catégorie telle quelle. */
export function xLabel(axis: Axis, index: number, fmt: Formatter): string {
  const value = axis.values[index];
  if (value === undefined) return '';
  if (typeof value === 'number') return fmt.number(value);
  return axis.kind === 'time' ? fmt.dateLabel(value) : value;
}

export interface Found {
  readonly value: number;
  readonly index: number;
}

export interface Extremes {
  readonly first: Found;
  readonly last: Found;
  readonly min: Found;
  readonly max: Found;
}

/** Premier, dernier, plus petit et plus grand point présents ; `null` si aucun. */
export function extremes(series: Series): Extremes | null {
  const present = series.values.flatMap((value, index): Found[] =>
    value === null ? [] : [{ value, index }],
  );
  const [first, last] = [present[0], present[present.length - 1]];
  if (first === undefined || last === undefined) return null;
  const pick = (better: (a: number, b: number) => boolean): Found =>
    present.reduce((best, item) => (better(item.value, best.value) ? item : best));
  return { first, last, min: pick((a, b) => a < b), max: pick((a, b) => a > b) };
}

/** Phrase sur les données manquantes d'une série, vide s'il n'y en a pas. */
export function missingNote(series: Series): string {
  const missing = series.values.filter((value) => value === null).length;
  if (missing === 0) return '';
  return ` ${missing} ${missing === 1 ? MISSING_ONE : MISSING_MANY}.`;
}
