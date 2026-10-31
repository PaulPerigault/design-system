/**
 * Mêmes noms et signatures que `@paulperigault/tokens` (`lib/color.ts`), calculés par `pp-color`.
 * Écarts de contrat (README) : une erreur est une `ColorError` typée, et une entrée non finie ou
 * hors bornes est refusée au lieu de donner `NaN`.
 */
import { fromRgb, toOklch, toRgb } from './channels.ts';
import { run } from './runtime.ts';
import type { Oklch, Rgb } from './types.ts';

const DEFAULT_GAMUT_EPSILON = 1e-4;

export const oklchToLinearSrgb = ({ l, c, h }: Oklch): Rgb =>
  run((raw) => toRgb(raw.oklchToLinearSrgb(l, c, h)));

/** Sans rognage : hors gamut, les canaux sortent de [0, 1]. */
export const oklchToSrgb = ({ l, c, h }: Oklch): Rgb =>
  run((raw) => toRgb(raw.oklchToSrgb(l, c, h)));

export const srgbToOklch = (color: Rgb): Oklch =>
  run((raw) => toOklch(raw.srgbToOklch(fromRgb(color))));

export const linearToGamma = (value: number): number => run((raw) => raw.linearToGamma(value));

export const gammaToLinear = (value: number): number => run((raw) => raw.gammaToLinear(value));

/** Vrai si chaque canal gamma est dans [-epsilon, 1 + epsilon]. */
export const inSrgbGamut = ({ l, c, h }: Oklch, epsilon = DEFAULT_GAMUT_EPSILON): boolean =>
  run((raw) => raw.inSrgbGamut(l, c, h, epsilon));

/** Réduit le chroma jusqu'à tenir dans sRGB (équivalent de `fitToGamut` de `tokens`). */
export const fitToGamut = ({ l, c, h }: Oklch): Oklch =>
  run((raw) => toOklch(raw.fitToGamut(l, c, h)));

/** Hors gamut sRGB : `ColorError` `out-of-gamut` (la référence lève une `RangeError`). */
export const toHex = ({ l, c, h }: Oklch): string => run((raw) => raw.toHex(l, c, h));

/** `'#rrggbb'` → OKLCH ; autre texte : `ColorError` `invalid-hex` (la référence : `TypeError`). */
export const hexToOklch = (hex: string): Oklch => run((raw) => toOklch(raw.hexToOklch(hex)));
