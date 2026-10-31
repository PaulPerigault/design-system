/** Mêmes formes que `@paulperigault/tokens` (`color-data.ts`) : l, c dans [0, 1] et ≥ 0, h en degrés. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Canaux sRGB (gamma ou linéaires selon la fonction), dans [0, 1] sauf hors gamut. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `'#rrggbb'` ou objet OKLCH ; hors gamut sRGB : `ColorError` `out-of-gamut`. */
export type ContrastColor = string | Oklch;
