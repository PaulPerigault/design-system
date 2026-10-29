import type { Ink } from '../domain/ink.ts';
import { inkOn } from '../domain/ink.ts';
import type { Theme } from '../domain/types.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import { readThemeColor, themeBaseFromTokens } from './theme-base.ts';

/** Neutre à poser sur une couleur de série, par thème ; `null` : aucun n'atteint 4,5:1. */
export interface SeriesInk {
  readonly light: Ink | null;
  readonly dark: Ink | null;
}

function inkIn(tokens: unknown, theme: Theme, rank: number): Result<Ink | null> {
  const base = themeBaseFromTokens(tokens, theme);
  if (!base.ok) return base;
  const name = `--pp-chart-${rank}`;
  const color = readThemeColor(tokens, theme, name);
  if (!color) return fail('palette.bad-base', `tokens.json : ${name} absent (${theme}).`, name);
  return ok(inkOn(color, base.value));
}

/**
 * Texte lisible (≥ 4,5:1) sur chacune des `count` couleurs `--pp-chart-N`, lues dans `tokens.json`,
 * dans les deux thèmes.
 */
export function seriesInksFromTokens(tokens: unknown, count: number): Result<readonly SeriesInk[]> {
  const inks: SeriesInk[] = [];
  for (let rank = 1; rank <= count; rank += 1) {
    const light = inkIn(tokens, 'light', rank);
    if (!light.ok) return light;
    const dark = inkIn(tokens, 'dark', rank);
    if (!dark.ok) return dark;
    inks.push({ light: light.value, dark: dark.value });
  }
  return ok(inks);
}
