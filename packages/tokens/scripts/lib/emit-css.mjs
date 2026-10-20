/**
 * `tokens.css` : couleurs en `light-dark(clair, sombre)`, tokens de base, bascule forcée par
 * `data-theme`, durées à 0 sous `prefers-reduced-motion: reduce`.
 */
import { byName } from './flatten.mjs';

export const CSS_HEADER =
  '/* Fichier généré par scripts/build.mjs depuis src/tokens/ : ne pas éditer. */';
const INDENT = '  ';
const ZERO_DURATION = '0ms';
const PRINT_WIDTH = 100; // .prettierrc

function block(selector, lines, indent = '') {
  const body = lines.map((line) => (line === '' ? '' : `${indent}${INDENT}${line}`));
  return [`${indent}${selector} {`, ...body, `${indent}}`];
}

/** Associe les couleurs claires et sombres par nom ; les deux thèmes doivent coïncider. */
export function pairThemes({ light, dark }) {
  if (light === undefined || dark === undefined) {
    throw new TypeError('emitCss : thèmes « light » et « dark » requis.');
  }
  const darkByName = new Map(dark.map((color) => [color.name, color]));
  const lightNames = new Set(light.map((color) => color.name));
  const unpaired = [...lightNames.symmetricDifference(new Set(darkByName.keys()))];
  if (unpaired.length > 0) {
    throw new TypeError(`emitCss : couleurs non appariées : ${unpaired.join(', ')}.`);
  }
  return light.map((color) => ({
    name: color.name,
    css: `light-dark(${color.oklch}, ${darkByName.get(color.name).oklch})`,
  }));
}

function reducedMotion(base) {
  const durations = base.filter((token) => token.type === 'duration');
  if (durations.length === 0) return [];
  const lines = durations.map((token) => `${token.name}: ${ZERO_DURATION};`);
  return ['', '@media (prefers-reduced-motion: reduce) {', ...block(':root', lines, INDENT), '}'];
}

/**
 * Forme de Prettier : une liste de familles trop longue pour `PRINT_WIDTH` passe à la ligne
 * après les deux-points, la liste entière sur la ligne suivante, indentée.
 */
function declaration({ name, type, css }) {
  const line = `${name}: ${css};`;
  if (type !== 'fontFamily' || INDENT.length + line.length <= PRINT_WIDTH) return [line];
  return [`${name}:`, `${INDENT}${css};`];
}

/** @param {{ base: { name: string, type: string, css: string }[], themes: object }} model */
export function emitCss({ base, themes }) {
  const tokens = [...pairThemes(themes), ...base].sort(byName);
  const declarations = tokens.flatMap(declaration);
  const lines = [
    CSS_HEADER,
    '',
    ...block(':root', ['color-scheme: light dark;', '', ...declarations]),
    '',
    ...block(":root[data-theme='light']", ['color-scheme: light;']),
    '',
    ...block(":root[data-theme='dark']", ['color-scheme: dark;']),
    ...reducedMotion(base),
  ];
  return `${lines.join('\n')}\n`;
}
