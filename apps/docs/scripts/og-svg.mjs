import { URL } from 'node:url';
import { OG_IMAGE, SITE_NAME, SITE_URL } from '../src/lib/site.ts';
import { wrapText } from './og-text.mjs';

/**
 * SVG de l'image Open Graph (1200 × 630) : aplats uniquement, aucun dégradé, ombre ni flou.
 * Polices : piles génériques, seules disponibles de façon fiable sous librsvg (le dépôt ne
 * fournit que du woff2 variable, que librsvg ne charge pas).
 */

export const WIDTH = OG_IMAGE.width;
export const HEIGHT = OG_IMAGE.height;
const FONT_STACK = 'Helvetica, Arial, sans-serif';
const MARGIN = 64;
const LOGO_SIZE = 56;
const LOGO_GAP = 20;
/** Largeur moyenne d'un caractère en em : volontairement large (DejaVu Sans, Helvetica gras). */
const CHAR_EM = 0.6;
const BRAND = { size: 28, weight: 600 };
/** Espace entre le logo et le filet d'accent. */
const RULE_OFFSET = 40;
const RULE = { width: 96, height: 8, top: MARGIN + LOGO_SIZE + RULE_OFFSET };
const TITLE = { size: 56, lineHeight: 66, maxLines: 3, weight: 700 };
const BODY = { size: 30, lineHeight: 42, maxLines: 3, weight: 400, gap: 60 };
/** Espace entre le filet d'accent et le haut du titre. */
const TITLE_GAP = 24;
const FOOTER = { size: 26, weight: 400 };
const HALF = 2;
/** Décalage de la ligne de base pour centrer un texte capitale/bas-de-casse sur un axe. */
const BASELINE_SHIFT_EM = 0.35;

const escapeXml = (text) => text.replace(/[&<>"']/gu, (char) => `&#${char.codePointAt(0)};`);

const maxCharsOf = (size) => Math.floor((WIDTH - HALF * MARGIN) / (size * CHAR_EM));

function textLine({ x, y, size, weight, fill, text }) {
  const attrs = `x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}"`;
  return `<text ${attrs} font-weight="${weight}" fill="${fill}">${escapeXml(text)}</text>`;
}

/** Lignes successives à partir de la première ligne de base `y`. */
function block(lines, style, y) {
  return lines.map((text, index) =>
    textLine({ ...style, x: MARGIN, y: y + index * style.lineHeight, text }),
  );
}

/** Image 1200 × 630 : logo et nom du site, filet d'accent, titre, description, adresse. */
export function buildSvg({ title, description, colors, logoUri }) {
  const titleLines = wrapText(title, maxCharsOf(TITLE.size), TITLE.maxLines);
  const bodyLines = wrapText(description, maxCharsOf(BODY.size), BODY.maxLines);
  const titleY = RULE.top + RULE.height + TITLE.size + TITLE_GAP;
  const bodyY = titleY + (titleLines.length - 1) * TITLE.lineHeight + BODY.gap;
  const brandY = MARGIN + LOGO_SIZE / HALF + BRAND.size * BASELINE_SHIFT_EM;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.bg}"/>`,
    `<image href="${logoUri}" x="${MARGIN}" y="${MARGIN}" width="${LOGO_SIZE}" height="${LOGO_SIZE}"/>`,
    textLine({
      ...BRAND,
      x: MARGIN + LOGO_SIZE + LOGO_GAP,
      y: brandY,
      fill: colors.fg,
      text: SITE_NAME,
    }),
    `<rect x="${MARGIN}" y="${RULE.top}" width="${RULE.width}" height="${RULE.height}" fill="${colors.accent}"/>`,
    ...block(titleLines, { ...TITLE, fill: colors.fg }, titleY),
    ...block(bodyLines, { ...BODY, fill: colors.muted }, bodyY),
    textLine({
      ...FOOTER,
      x: MARGIN,
      y: HEIGHT - MARGIN,
      fill: colors.muted,
      text: new URL(SITE_URL).host,
    }),
    '</svg>',
  ];
  return parts.join('\n');
}
