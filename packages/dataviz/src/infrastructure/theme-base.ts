import { parseOklch } from '@paulperigault/tokens/color';
import type { Oklch } from '@paulperigault/tokens/color';
import type { Theme, ThemeBase } from '../domain/palette/types.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import { isRecord } from './guards.ts';

const NAMES = {
  accent: '--pp-color-accent',
  onAccent: '--pp-color-on-accent',
  bg: '--pp-color-bg',
  fg: '--pp-color-fg',
  line: '--pp-color-line',
} as const;

function readColor(theme: unknown, name: string): Oklch | undefined {
  const entry = isRecord(theme) ? theme[name] : undefined;
  const text = isRecord(entry) ? entry['oklch'] : undefined;
  if (typeof text !== 'string') return undefined;
  try {
    return parseOklch(text);
  } catch {
    return undefined;
  }
}

/** Lit accent, texte sur accent, fond, texte et trait d'un thème dans `tokens.json` (`themes.*`). */
export function themeBaseFromTokens(tokens: unknown, theme: Theme): Result<ThemeBase> {
  const themes = isRecord(tokens) ? tokens['themes'] : undefined;
  const source = isRecord(themes) ? themes[theme] : undefined;
  const read = (key: keyof typeof NAMES): Oklch | undefined => readColor(source, NAMES[key]);
  const [accent, onAccent, bg, fg, line] = [
    read('accent'),
    read('onAccent'),
    read('bg'),
    read('fg'),
    read('line'),
  ];
  if (!accent || !onAccent || !bg || !fg || !line) {
    return fail('palette.bad-base', `tokens.json : thème « ${theme} » incomplet.`, theme);
  }
  return ok({ accent, onAccent, bg, fg, line });
}
