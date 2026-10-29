import { contrastRatio } from '../lib/contrast.ts';
import { fitToGamut } from '../palette/domain/color/gamut.ts';
import { derivePalettes } from '../palette/domain/derive.ts';
import { paletteTokens } from '../palette/domain/tokens.ts';
import type { TokenMap } from '../palette/domain/tokens.ts';
import type { Theme, ThemeBase } from '../palette/domain/types.ts';
import type { Result } from './result.ts';
import { settleAll } from './settle.ts';
import { fail, ok } from './result.ts';

export const THEME_NAMES: readonly Theme[] = ['light', 'dark'];

/** Variables d'un thème (accent, texte sur accent, séries, rampes) : valeurs `oklch(...)`. */
export type ThemeOverrides = Readonly<Record<Theme, TokenMap>>;

const RATIO_DIGITS = 2;

function deriveTheme(hue: number, theme: Theme, base: ThemeBase): Result<TokenMap> {
  const palettes = derivePalettes(hue, theme, base);
  if (palettes.ok) return ok(settleAll(paletteTokens(palettes.value)));
  const { code, message } = palettes.error;
  if (code === 'palette.contrast-failed') {
    const ratio = contrastRatio(base.onAccent, fitToGamut({ ...base.accent, h: hue })).toFixed(
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
 * neutres) viennent des jetons : seule la teinte change, les neutres restent à leur teinte.
 */
export function deriveOverrides(
  hue: number,
  bases: Readonly<Record<Theme, ThemeBase>>,
): Result<ThemeOverrides> {
  const light = deriveTheme(hue, 'light', bases.light);
  if (!light.ok) return light;
  const dark = deriveTheme(hue, 'dark', bases.dark);
  if (!dark.ok) return dark;
  return ok({ light: light.value, dark: dark.value });
}
