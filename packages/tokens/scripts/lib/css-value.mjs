/**
 * Valeur CSS d'un token, par `$type` DTCG 2025.10 (sous-ensemble utilisé par le design system).
 * Couleurs : OKLCH uniquement, formatées par `formatOklch` ; `toHex` lève hors gamut sRGB.
 */
import { formatOklch, toHex } from '../../src/lib/color.mjs';

/** Familles génériques (CSS Fonts 4 § 2.1.3) : mots-clés, jamais entre guillemets. */
const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

/** Guillemets simples : forme que Prettier (`singleQuote`) garde telle quelle en CSS. */
const quoteFamily = (family) => {
  if (GENERIC_FAMILIES.has(family)) return family;
  if (/[',\\\n]/.test(family)) {
    throw new TypeError(`fontFamily : « ${family} » non pris en charge.`);
  }
  return `'${family}'`;
};

const dimension = ({ value, unit }) => `${value}${unit}`;

const FORMATTERS = {
  color: (value) => formatOklch(oklchOf(value)),
  dimension,
  duration: dimension,
  fontFamily: (value) => [value].flat().map(quoteFamily).join(', '),
  fontWeight: String,
  number: String,
  cubicBezier: (value) => `cubic-bezier(${value.join(', ')})`,
};

/** `{ colorSpace: 'oklch', components: [L, C, H] }` → `{ l, c, h }`. */
export function oklchOf(value) {
  if (value?.colorSpace !== 'oklch') {
    throw new TypeError(`couleur : espace « ${value?.colorSpace} » non pris en charge (oklch).`);
  }
  const [l, c, h] = value.components;
  return { l, c, h };
}

/** @param {{ name: string, type: string, value: unknown }} token */
export function cssValue({ name, type, value }) {
  const format = Object.hasOwn(FORMATTERS, type) ? FORMATTERS[type] : undefined;
  if (format === undefined) {
    throw new TypeError(`${name} : $type « ${type} » non pris en charge.`);
  }
  return format(value);
}

/** Token de thème : couleur obligatoire, valeur CSS et hexadécimal (pour `theme-color`). */
export function colorEntry(token) {
  if (token.type !== 'color') {
    throw new TypeError(`${token.name} : un thème ne porte que des couleurs.`);
  }
  const oklch = oklchOf(token.value);
  return { name: token.name, oklch: formatOklch(oklch), hex: toHex(oklch) };
}
