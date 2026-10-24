import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';

/**
 * Police des images Open Graph : Atkinson Hyperlegible Next (OFL, voir `fonts/OFL.txt`), en .ttf
 * auto-hébergé. librsvg ne lit pas les polices du dépôt de façon portable (fontconfig sous Linux,
 * CoreText sous macOS) : le texte est donc converti en contours, rendu identique partout.
 */

export const FONT_FAMILY = 'Atkinson Hyperlegible Next';
export const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fonts');
const BOLD_FROM = 600;
const FILES = {
  regular: 'AtkinsonHyperlegibleNext-Regular.ttf',
  bold: 'AtkinsonHyperlegibleNext-Bold.ttf',
};
const cache = new Map();

/** Police chargée pour une graisse CSS (≥ 600 : gras). */
export function fontOf(weight, dir = FONTS_DIR) {
  const file = weight >= BOLD_FROM ? FILES.bold : FILES.regular;
  if (!cache.has(file)) cache.set(file, create(readFileSync(join(dir, file))));
  return cache.get(file);
}

const escapeXml = (text) => text.replace(/[&<>"']/gu, (char) => `&#${char.codePointAt(0)};`);
const PRECISION = 1e4;
const round = (value) => Math.round(value * PRECISION) / PRECISION;

/** Contours SVG d'une ligne de texte posée à (x, y) = début de la ligne de base. */
export function textPath({ text, x, y, size, weight, fill }) {
  const font = fontOf(weight);
  const scale = size / font.unitsPerEm;
  let pen = 0;
  const parts = [];
  for (const glyph of font.glyphsForString(text)) {
    const d = glyph.path.toSVG();
    const move = `translate(${round(x + pen * scale)} ${round(y)}) scale(${round(scale)} ${round(-scale)})`;
    if (d) parts.push(`<path transform="${move}" d="${d}"/>`);
    pen += glyph.advanceWidth;
  }
  return `<g fill="${fill}" data-font="${font.familyName}" data-y="${y}" data-text="${escapeXml(text)}">${parts.join('')}</g>`;
}

export const fontFilesOf = (dir = FONTS_DIR) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.ttf'))
    .sort();
