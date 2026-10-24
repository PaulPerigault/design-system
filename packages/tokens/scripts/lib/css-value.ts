/**
 * Valeur CSS d'un token, par `$type` DTCG 2025.10 (sous-ensemble utilisé par le design system).
 * Couleurs : OKLCH uniquement, formatées par `formatOklch` ; `toHex` lève hors gamut sRGB.
 */
import type { Oklch } from '../../src/lib/color.ts';
import { formatOklch, toHex } from '../../src/lib/color.ts';
import type { ThemeEntry, Token } from './types.ts';
import { isRecord, TokenError } from './types.ts';

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
const quoteFamily = (family: string): string => {
  if (GENERIC_FAMILIES.has(family)) return family;
  if (/[',\\\n]/.test(family)) {
    throw new TokenError('unsupported', `fontFamily : « ${family} » non pris en charge.`);
  }
  return `'${family}'`;
};

const dimension = (input: unknown): string => {
  if (!isRecord(input) || typeof input.value !== 'number' || typeof input.unit !== 'string') {
    throw new TokenError('invalid-token', 'dimension : { value: nombre, unit: texte } attendu.');
  }
  return `${input.value}${input.unit}`;
};

const strings = (input: unknown, what: string): string[] => {
  const list = Array.isArray(input) ? input : [input];
  if (!list.every((item) => typeof item === 'string')) {
    throw new TokenError('invalid-token', `${what} : texte ou liste de textes attendu.`);
  }
  return list;
};

const bezier = (input: unknown): string => {
  if (!Array.isArray(input) || !input.every((item) => typeof item === 'number')) {
    throw new TokenError('invalid-token', 'cubicBezier : liste de nombres attendue.');
  }
  return `cubic-bezier(${input.join(', ')})`;
};

const FORMATTERS: Record<string, (value: unknown) => string> = {
  color: (value) => formatOklch(oklchOf(value)),
  dimension,
  duration: dimension,
  fontFamily: (value) => strings(value, 'fontFamily').map(quoteFamily).join(', '),
  fontWeight: String,
  number: String,
  cubicBezier: bezier,
};

/** Les trois composantes `[L, C, H]` d'une couleur DTCG, validées comme nombres. */
function componentsOf(parts: unknown): [number, number, number] {
  const [l, c, h, ...rest] = Array.isArray(parts) ? parts : [];
  if (![l, c, h].every((part) => typeof part === 'number') || rest.length > 0) {
    throw new TokenError('invalid-token', 'couleur : components = [L, C, H] (nombres) attendu.');
  }
  return [l, c, h];
}

/** `{ colorSpace: 'oklch', components: [L, C, H] }` → `{ l, c, h }`. */
export function oklchOf(value: unknown): Oklch {
  const space = isRecord(value) ? value.colorSpace : undefined;
  if (!isRecord(value) || space !== 'oklch') {
    const message = `couleur : espace « ${String(space)} » non pris en charge (oklch).`;
    throw new TokenError('unsupported', message);
  }
  const [l, c, h] = componentsOf(value.components);
  return { l, c, h };
}

export function cssValue({ name, type, value }: Token): string {
  const format = Object.hasOwn(FORMATTERS, type) ? FORMATTERS[type] : undefined;
  if (format === undefined) {
    throw new TokenError('unsupported', `${name} : $type « ${type} » non pris en charge.`);
  }
  return format(value);
}

/** Token de thème : couleur obligatoire, valeur CSS et hexadécimal (pour `theme-color`). */
export function colorEntry(token: Token): ThemeEntry {
  if (token.type !== 'color') {
    throw new TokenError('invalid-token', `${token.name} : un thème ne porte que des couleurs.`);
  }
  const oklch = oklchOf(token.value);
  return { name: token.name, oklch: formatOklch(oklch), hex: toHex(oklch) };
}
