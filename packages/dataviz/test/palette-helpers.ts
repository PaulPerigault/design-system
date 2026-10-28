import tokens from '@paulperigault/tokens/tokens.json' with { type: 'json' };
import { derivePalettes } from '../src/domain/palette/derive.ts';
import type { Theme, ThemeBase } from '../src/domain/palette/types.ts';
import { themeBaseFromTokens } from '../src/infrastructure/theme-base.ts';

export const DEFAULT_HUE = 270.7;
export const HUES = [DEFAULT_HUE, ...Array.from({ length: 12 }, (_, index) => index * 30)];
export const THEMES: Theme[] = ['light', 'dark'];

export const baseOf = (theme: Theme): ThemeBase => {
  const result = themeBaseFromTokens(tokens, theme);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

export const palettesOf = (hue: number, theme: Theme) => {
  const result = derivePalettes(hue, theme, baseOf(theme));
  if (!result.ok) throw new Error(`${theme} ${hue} : ${result.error.message}`);
  return result.value;
};
