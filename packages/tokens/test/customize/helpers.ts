import { readFileSync } from 'node:fs';
import tokens from '../../generated/tokens.json' with { type: 'json' };
import type { ThemeSource } from '../../src/customize/derive-roles.ts';
import type { Theme } from '../../src/palette/domain/types.ts';
import {
  readThemeColor,
  themeBaseFromTokens,
} from '../../src/palette/infrastructure/theme-base.ts';

const root = new URL('../../', import.meta.url);

export const readSource = (name: string): string =>
  readFileSync(new URL(`src/tokens/${name}`, root), 'utf8');
export const readGenerated = (name: string): string =>
  readFileSync(new URL(`generated/${name}`, root), 'utf8');

export const DEFAULT_HUE = 270.7;
export const TWELVE_HUES = Array.from({ length: 12 }, (_, index) => index * 30);

/** Base d'un thème lue dans `tokens.json` : palette, neutres, focus, statut et surface. */
export function sourceOf(theme: Theme): ThemeSource {
  const base = themeBaseFromTokens(tokens, theme);
  const [focus, running, surface] = ['focus', 'status-running', 'surface'].map((name) =>
    readThemeColor(tokens, theme, `--pp-color-${name}`),
  );
  if (!base.ok || !focus || !running || !surface) throw new Error(`tokens.json : ${theme}`);
  return { ...base.value, focus, running, surface };
}
