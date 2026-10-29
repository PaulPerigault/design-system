/** Erreurs typées de la dérivation de palettes : union fermée à champ `code`. */
export const PALETTE_ERROR_CODES = [
  'palette.bad-hue',
  'palette.bad-base',
  'palette.cvd-failed',
  'palette.contrast-failed',
  'palette.sequential-failed',
  'palette.diverging-failed',
] as const;

export type PaletteErrorCode = (typeof PALETTE_ERROR_CODES)[number];

export interface PaletteError {
  readonly code: PaletteErrorCode;
  readonly message: string;
  /** Chemin de la valeur fautive, vide si global. */
  readonly path: string;
}

export const paletteError = (code: PaletteErrorCode, message: string, path = ''): PaletteError => ({
  code,
  message,
  path,
});
