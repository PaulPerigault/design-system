import type { Oklch } from '@paulperigault/tokens/color';
import { fitToGamut } from '../color/gamut.ts';
import { DIVERGING_COUNT, SEQUENTIAL_COUNT } from './thresholds.ts';
import type { Theme, ThemeBase } from './types.ts';

const HALF_TURN = 180;
const TWO_SIDES = 2;
const FULL_TURN = 360;
/** Part du chroma de l'accent au pas le plus pâle de la séquentielle. */
const PALE_CHROMA_SHARE = 0.2;
/** Écart de clarté entre le pas le plus pâle et l'accent. */
const PALE_LIGHTNESS_GAP = 0.45;
/** Clarté de l'extrémité opposée décalée de celle de l'accent : elle s'en distingue même sans la teinte (tritanopie). */
const OPPOSITE_SHIFT = 0.12;

const mix = (from: number, to: number, t: number): number => from + (to - from) * t;
const towardBackground = (theme: Theme): number => (theme === 'light' ? 1 : -1);

/** 7 pas d'une seule teinte, clarté monotone du plus pâle à l'accent (Brewer, 2003, pour le principe). */
export function deriveSequential(base: ThemeBase, hue: number, theme: Theme): Oklch[] {
  const from = base.accent.l + towardBackground(theme) * PALE_LIGHTNESS_GAP;
  return Array.from({ length: SEQUENTIAL_COUNT }, (_, index) => {
    const t = index / (SEQUENTIAL_COUNT - 1);
    const chroma = mix(base.accent.c * PALE_CHROMA_SHARE, base.accent.c, t);
    return fitToGamut({ l: mix(from, base.accent.l, t), c: chroma, h: hue });
  });
}

/** Extrémité opposée : teinte à 180°, clarté décalée vers le fond. */
export function oppositeEnd(base: ThemeBase, hue: number, theme: Theme): Oklch {
  return fitToGamut({
    l: base.accent.l + towardBackground(theme) * OPPOSITE_SHIFT,
    c: base.accent.c,
    h: (hue + HALF_TURN) % FULL_TURN,
  });
}

/** Accent, centre neutre (`--pp-color-line`), teinte opposée : 7 pas égaux. */
export function deriveDiverging(base: ThemeBase, hue: number, theme: Theme): Oklch[] {
  const accent = fitToGamut({ ...base.accent, h: hue });
  const opposite = oppositeEnd(base, hue, theme);
  const middle = (DIVERGING_COUNT - 1) / TWO_SIDES;
  return Array.from({ length: DIVERGING_COUNT }, (_, index) => {
    if (index === middle) return base.line;
    const end = index < middle ? accent : opposite;
    const t = Math.abs(index - middle) / middle;
    return fitToGamut({ l: mix(base.line.l, end.l, t), c: mix(base.line.c, end.c, t), h: end.h });
  });
}
