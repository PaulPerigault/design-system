import type { Series } from '@paulperigault/dataviz';

/** Valeurs à plat pour le `.wasm` : `0` à la place d'une valeur manquante (le masque la signale). */
export const floats = (values: readonly (number | null)[]): Float64Array =>
  Float64Array.from(values, (value) => value ?? 0);

/** Masque des manquants : 1 = manquant. Jamais `NaN` : il resterait indiscernable d'une entrée refusée. */
export const missingMask = (values: readonly (number | null)[]): Uint8Array =>
  Uint8Array.from(values, (value) => (value === null ? 1 : 0));

/** Séries à plat, série après série, avec leur masque. */
export function flatten(series: readonly Series[]): { values: Float64Array; missing: Uint8Array } {
  const all = series.flatMap((item) => item.values);
  return { values: floats(all), missing: missingMask(all) };
}

/** Valeurs à plat rendues par le `.wasm` → une liste par série ; `NaN` (groupe vide) devient `null`. */
export function unflatten(values: Float64Array, width: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  for (let start = 0; width > 0 && start < values.length; start += width) {
    const row = values.subarray(start, start + width);
    rows.push(Array.from(row, (value) => (Number.isNaN(value) ? null : value)));
  }
  return rows;
}
