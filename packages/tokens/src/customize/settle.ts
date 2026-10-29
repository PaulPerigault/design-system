import { formatOklch, inSrgbGamut, parseOklch } from '../lib/color.ts';
import type { TokenMap } from '../palette/domain/tokens.ts';

/** Pas de réduction du chroma : la précision d'écriture de `formatOklch` (4 décimales). */
const CHROMA_STEP = 1e-4;

/**
 * Une couleur au bord du gamut peut sortir de sRGB une fois arrondie à l'écriture : on réduit le
 * chroma par pas de la précision d'écriture. Le CSS, l'hexadécimal et le contrôle de contraste
 * lisent alors la même valeur.
 */
export function settle(value: string): string {
  let color = parseOklch(value);
  while (!inSrgbGamut(color) && color.c > 0) {
    color = parseOklch(formatOklch({ ...color, c: Math.max(0, color.c - CHROMA_STEP) }));
  }
  return formatOklch(color);
}

export const settleAll = (tokens: TokenMap): TokenMap =>
  Object.fromEntries(Object.entries(tokens).map(([name, value]) => [name, settle(value)]));
