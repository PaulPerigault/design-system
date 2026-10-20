/** Couleur OKLCH : `l` dans [0, 1], `c` ≥ 0, `h` en degrés. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Canaux sRGB, linéaires ou gamma selon la fonction ; [0, 1] dans le gamut. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `'oklch(0.47 0.19 270.7)'` ou `'oklch(47% 0.19 270.7)'` ; lève une `TypeError` sinon. */
export function parseOklch(text: string): Oklch;

/** `'oklch(47% 0.19 270.7)'` : 4 décimales au plus, sans zéros inutiles. */
export function formatOklch(color: Oklch): string;

/** OKLCH → Oklab → LMS → sRGB linéaire (CSS Color 4, matrices d'Ottosson). */
export function oklchToLinearSrgb(color: Oklch): Rgb;

/** Fonction de transfert sRGB, linéaire → gamma. */
export function linearToGamma(value: number): number;

/** Fonction de transfert sRGB, gamma → linéaire. */
export function gammaToLinear(value: number): number;

/** sRGB gamma, sans rognage : hors gamut, les canaux sortent de [0, 1]. */
export function oklchToSrgb(color: Oklch): Rgb;

/** Vrai si chaque canal gamma est dans [-epsilon, 1 + epsilon] (epsilon : 1e-4 par défaut). */
export function inSrgbGamut(color: Oklch, epsilon?: number): boolean;

/** `'#rrggbb'` ; lève une `RangeError` si la couleur est hors gamut sRGB. */
export function toHex(color: Oklch): string;

/** `'#rrggbb'` → OKLCH, `h` dans [0, 360), 0 pour un gris ; lève une `TypeError` sinon. */
export function hexToOklch(hex: string): Oklch;
