/**
 * `tokens.json` : couleurs par thème (OKLCH et hexadécimal), valeurs CSS de base, et
 * `themeColor` (= `color.bg` de chaque thème) pour `<meta name="theme-color">`.
 */
import { byName } from './flatten.mjs';

export const THEME_COLOR_TOKEN = '--pp-color-bg';
const JSON_INDENT = 2;

const sortedObject = (list, pick) =>
  Object.fromEntries([...list].sort(byName).map((item) => [item.name, pick(item)]));

function themeColor([theme, colors]) {
  const bg = colors.find((color) => color.name === THEME_COLOR_TOKEN);
  if (bg === undefined) throw new TypeError(`emitJson : ${THEME_COLOR_TOKEN} absent (${theme}).`);
  return [theme, bg.hex];
}

/** Thèmes dans l'ordre du resolver (clair puis sombre) ; tokens triés par nom. */
export const themeColors = (themes) => Object.fromEntries(Object.entries(themes).map(themeColor));

export function emitJson({ base, themes }) {
  const pick = ({ oklch, hex }) => ({ oklch, hex });
  const document = {
    themes: Object.fromEntries(
      Object.entries(themes).map(([theme, colors]) => [theme, sortedObject(colors, pick)]),
    ),
    base: sortedObject(base, (token) => token.css),
    themeColor: themeColors(themes),
  };
  return `${JSON.stringify(document, null, JSON_INDENT)}\n`;
}
