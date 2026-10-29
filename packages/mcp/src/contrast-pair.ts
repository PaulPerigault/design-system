// Résolution d'une couleur (hexadécimal, oklch, jeton --pp-*) et rapport de contraste :
// ratio WCAG 2 (normatif, @paulperigault/tokens/contrast) et Lc APCA (informatif).
import { parseOklch, toHex } from '@paulperigault/tokens/color';
import { contrastRatio } from '@paulperigault/tokens/contrast';
import { APCA_VERSION, apcaLc } from './apca.ts';
import type { Tokens } from './data.ts';
import { ToolError } from './schemas.ts';

export type Theme = 'light' | 'dark';

export interface ResolvedColor {
  input: string;
  value: string;
  hex: string;
  theme?: Theme;
}

type Pair = Tokens['pairs'][number];
type ThemeTokens = Tokens['themes'][Theme];

const TOKEN_PREFIX = '--pp-';
const LONG_HEX = /^#[0-9a-f]{6}$/;
const SHORT_HEX = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/;
// WCAG 2.2, critères 1.4.3 (AA) et 1.4.6 (AAA) : texte normal et grand texte.
const WCAG = Object.freeze({ aaNormal: 4.5, aaLarge: 3, aaaNormal: 7, aaaLarge: 4.5 });
const RATIO_PRECISION = 100;
const LC_PRECISION = 10;
const APCA_NOTE =
  'APCA est informatif : il n’est pas normatif en WCAG 2.2, seul le ratio WCAG 2 fait foi.';

const round = (value: number, precision: number): number =>
  Math.round(value * precision) / precision;

function oklchToHex(text: string): string {
  try {
    return toHex(parseOklch(text));
  } catch (error) {
    if (error instanceof RangeError) throw new ToolError(`« ${text} » est hors du gamut sRGB.`);
    throw new ToolError(`« ${text} » n’est pas une couleur oklch() lisible.`);
  }
}

function resolveToken(name: string, tokens: Tokens, theme: Theme): ResolvedColor {
  const themed = tokens.themes[theme][name];
  if (themed) return { input: name, theme, value: themed.oklch, hex: themed.hex };
  const base = tokens.base[name];
  if (base === undefined) throw new ToolError(`jeton inconnu ${name} (voir get_tokens).`);
  if (!base.startsWith('oklch(')) throw new ToolError(`le jeton ${name} n’est pas une couleur.`);
  return { input: name, value: base, hex: oklchToHex(base) };
}

/** `input` : `#rgb`, `#rrggbb`, `oklch(…)` ou `--pp-…`. */
export function resolveColor(
  input: string,
  { tokens, theme }: { tokens: Tokens; theme: Theme },
): ResolvedColor {
  const text = input.trim().toLowerCase();
  if (text.startsWith(TOKEN_PREFIX)) return resolveToken(text, tokens, theme);
  if (LONG_HEX.test(text)) return { input, value: text, hex: text };
  const short = SHORT_HEX.exec(text);
  if (short) {
    const hex = `#${short
      .slice(1)
      .map((digit) => digit + digit)
      .join('')}`;
    return { input, value: hex, hex };
  }
  return { input, value: text, hex: oklchToHex(text) };
}

/** Rapport complet pour `check_contrast`. Les seuils se comparent au ratio brut, sans arrondi. */
export function contrastReport(
  foreground: ResolvedColor,
  background: ResolvedColor,
): Record<string, unknown> {
  const ratio = contrastRatio(foreground.value, background.value);
  return {
    foreground,
    background,
    wcag: {
      ratio: round(ratio, RATIO_PRECISION),
      normalText: { aa: ratio >= WCAG.aaNormal, aaa: ratio >= WCAG.aaaNormal },
      largeText: { aa: ratio >= WCAG.aaLarge, aaa: ratio >= WCAG.aaaLarge },
      reference: 'WCAG 2.2, critères 1.4.3 (AA) et 1.4.6 (AAA)',
    },
    apca: {
      lc: round(apcaLc(foreground.hex, background.hex), LC_PRECISION),
      version: APCA_VERSION,
      note: APCA_NOTE,
    },
  };
}

/** Contraste d'une paire connue (`roles.json`) dans un thème ; `undefined` si un jeton manque. */
export function pairReport(
  pair: Pair,
  themeTokens: ThemeTokens,
): Record<string, unknown> | undefined {
  const fg = themeTokens[pair.fg];
  const bg = themeTokens[pair.bg];
  if (!fg || !bg) return undefined;
  const ratio = contrastRatio(fg.oklch, bg.oklch);
  return {
    foreground: pair.fg,
    background: pair.bg,
    ratio: round(ratio, RATIO_PRECISION),
    min: pair.min,
    norm: pair.norm,
    passes: ratio >= pair.min,
  };
}
