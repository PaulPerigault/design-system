import { contrastRatio } from '../lib/contrast.ts';
import { fitToGamut } from '../palette/domain/color/gamut.ts';
import { derivePalettes } from '../palette/domain/derive.ts';
import { paletteTokens } from '../palette/domain/tokens.ts';
import type { TokenMap } from '../palette/domain/tokens.ts';
import type { Palettes, Theme } from '../palette/domain/types.ts';
import { deriveRoles } from './derive-roles.ts';
import type { ThemeSource } from './derive-roles.ts';
import type { Result } from './result.ts';
import { settleAll } from './settle.ts';
import { fail, ok } from './result.ts';

export const THEME_NAMES: readonly Theme[] = ['light', 'dark'];

/** Variables d'un thème (accent, texte sur accent, séries, rampes, focus, statut) en `oklch(...)`. */
export type ThemeOverrides = Readonly<Record<Theme, TokenMap>>;

const RATIO_DIGITS = 2;

function withRoles(palettes: Palettes, theme: Theme, source: ThemeSource): Result<TokenMap> {
  const roles = deriveRoles(palettes.hue, theme, source);
  if (!roles.ok) return roles;
  return ok({ ...settleAll(paletteTokens(palettes)), ...roles.value });
}

function deriveTheme(hue: number, theme: Theme, source: ThemeSource): Result<TokenMap> {
  const palettes = derivePalettes(hue, theme, source);
  if (palettes.ok) return withRoles(palettes.value, theme, source);
  const { code, message } = palettes.error;
  if (code === 'palette.contrast-failed') {
    const ratio = contrastRatio(source.onAccent, fitToGamut({ ...source.accent, h: hue })).toFixed(
      RATIO_DIGITS,
    );
    return fail(
      'build.contrast-failed',
      `Teinte ${hue}, thème ${theme} : texte sur accent à ${ratio}:1, 4,5:1 exigé.`,
    );
  }
  return fail('build.derivation-failed', `Teinte ${hue}, thème ${theme} : ${message}`);
}

/**
 * Dérive les variables des deux thèmes depuis la teinte. Les bases (clarté, chroma de l'accent,
 * neutres, focus, statut) viennent des jetons : seule la teinte change, les neutres restent à leur
 * teinte.
 */
export function deriveOverrides(
  hue: number,
  bases: Readonly<Record<Theme, ThemeSource>>,
): Result<ThemeOverrides> {
  const light = deriveTheme(hue, 'light', bases.light);
  if (!light.ok) return light;
  const dark = deriveTheme(hue, 'dark', bases.dark);
  if (!dark.ok) return dark;
  return ok({ light: light.value, dark: dark.value });
}
