import type { Oklch, Rgb } from './types.ts';

const NAN = Number.NaN;

/** Triplet rendu par le `.wasm` en `Rgb` (le `.wasm` rend toujours trois valeurs). */
export function toRgb(values: Float64Array): Rgb {
  const [r = NAN, g = NAN, b = NAN] = values;
  return { r, g, b };
}

export function toOklch(values: Float64Array): Oklch {
  const [l = NAN, c = NAN, h = NAN] = values;
  return { l, c, h };
}

export const fromRgb = ({ r, g, b }: Rgb): Float64Array => Float64Array.of(r, g, b);
