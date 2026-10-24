/**
 * `tokens.json` : couleurs par thème (OKLCH et hexadécimal), valeurs CSS de base, et
 * `themeColor` (= `color.bg` de chaque thème) pour `<meta name="theme-color">`.
 */
import { byName } from './flatten.ts';
import type { Model, ThemeEntry } from './types.ts';
import { TokenError } from './types.ts';

export const THEME_COLOR_TOKEN = '--pp-color-bg';
const JSON_INDENT = 2;

const sortedObject = <T extends { name: string }>(
  list: T[],
  pick: (item: T) => unknown,
): Record<string, unknown> =>
  Object.fromEntries([...list].sort(byName).map((item) => [item.name, pick(item)]));

function themeColor([theme, colors]: [string, ThemeEntry[]]): [string, string] {
  const bg = colors.find((color) => color.name === THEME_COLOR_TOKEN);
  if (bg === undefined)
    throw new TokenError('inconsistent', `emitJson : ${THEME_COLOR_TOKEN} absent (${theme}).`);
  return [theme, bg.hex];
}

/** Thèmes dans l'ordre du resolver (clair puis sombre) ; tokens triés par nom. */
export const themeColors = (themes: Model['themes']): Record<string, string> =>
  Object.fromEntries(Object.entries(themes).map(themeColor));

export function emitJson({ base, themes }: Model): string {
  const pick = ({ oklch, hex }: ThemeEntry) => ({ oklch, hex });
  const document = {
    themes: Object.fromEntries(
      Object.entries(themes).map(([theme, colors]) => [theme, sortedObject(colors, pick)]),
    ),
    base: sortedObject(base, (token) => token.css),
    themeColor: themeColors(themes),
  };
  return `${JSON.stringify(document, null, JSON_INDENT)}\n`;
}
