import type { Oklch, Rgb } from '@paulperigault/tokens/color';
import { inSrgbGamut, oklchToLinearSrgb } from '@paulperigault/tokens/color';

const BISECTION_STEPS = 24;
const HALF = 0.5;

/** Réduit le chroma (clarté et teinte conservées) jusqu'à tenir dans sRGB : pas de rognage. */
export function fitToGamut(color: Oklch): Oklch {
  if (inSrgbGamut(color)) return color;
  let low = 0;
  let high = color.c;
  for (let step = 0; step < BISECTION_STEPS; step += 1) {
    const mid = (low + high) * HALF;
    if (inSrgbGamut({ ...color, c: mid })) low = mid;
    else high = mid;
  }
  return { ...color, c: low };
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** sRGB linéaire, borné à [0, 1] (bruit d'arrondi aux bords du gamut). */
export function toLinear(color: Oklch): Rgb {
  const { r, g, b } = oklchToLinearSrgb(color);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
}
