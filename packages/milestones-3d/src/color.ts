// Analyse d'une couleur calculée, telle que `getComputedStyle(el).color` la sérialise.
//
// Formats pris en charge (relevés sur Chromium 156, Firefox 153 et WebKit 27 : voir README) :
//   rgb() et rgba(), syntaxe à virgules ou à espaces, canaux en nombres ou en pourcentages ;
//   oklch() et oklab(), nombres, pourcentages, unités d'angle, `none` ;
//   color(srgb …) et color(srgb-linear …).
// L'opacité est lue puis ignorée : les jetons du thème sont opaques. Tout le reste (`lab()`,
// `lch()`, `color(display-p3 …)`, `color-mix()`…) lève `unsupported-color` : on ne devine pas.
import {
  CHANNEL_MAX,
  COMPONENTS,
  FULL_TURN_DEG,
  HALF_TURN_DEG,
  OK_FULL,
  hue,
  triple,
  value,
} from './color-values.ts';
import { MilestonesError } from './error.ts';
import type { ThemeColor } from './types.ts';

const FUNCTION = /^([a-z][a-z0-9-]*)\(\s*([^()]*?)\s*\)$/;
/** Transfert sRGB (IEC 61966-2-1) : seuil linéaire, pente basse, exposant et décalage. */
const LINEAR_KNEE = 0.0031308;
const LOW_SLOPE = 12.92;
const GAMMA = 2.4;
const GAMMA_SCALE = 1.055;
const GAMMA_OFFSET = 0.055;

type Parser = (parts: readonly string[]) => ThemeColor | null;

function rgb(parts: readonly string[]): ThemeColor | null {
  const channels = triple(parts, [CHANNEL_MAX, CHANNEL_MAX, CHANNEL_MAX]);
  if (!channels || parts.length > COMPONENTS + 1) return null;
  const [r, g, b] = channels;
  return { space: 'srgb', r: r / CHANNEL_MAX, g: g / CHANNEL_MAX, b: b / CHANNEL_MAX };
}

const gamma = (linear: number): number =>
  linear <= LINEAR_KNEE ? linear * LOW_SLOPE : GAMMA_SCALE * linear ** (1 / GAMMA) - GAMMA_OFFSET;

function colorFunction(parts: readonly string[]): ThemeColor | null {
  const [space, ...rest] = parts;
  const channels = rest.length === COMPONENTS ? triple(rest, [1, 1, 1]) : null;
  if (!channels || (space !== 'srgb' && space !== 'srgb-linear')) return null;
  const [r, g, b] = channels;
  return space === 'srgb'
    ? { space: 'srgb', r, g, b }
    : { space: 'srgb', r: gamma(r), g: gamma(g), b: gamma(b) };
}

function oklch(parts: readonly string[]): ThemeColor | null {
  const [l, c, h] = parts;
  if (parts.length !== COMPONENTS || l === undefined || c === undefined || h === undefined) {
    return null;
  }
  const [lightness, chroma, angle] = [value(l, 1), value(c, OK_FULL), hue(h)];
  if (lightness === null || chroma === null || angle === null) return null;
  return { space: 'oklch', l: lightness, c: chroma, h: angle };
}

function oklab(parts: readonly string[]): ThemeColor | null {
  const lab = parts.length === COMPONENTS ? triple(parts, [1, OK_FULL, OK_FULL]) : null;
  if (!lab) return null;
  const [l, a, b] = lab;
  const angle = (Math.atan2(b, a) * HALF_TURN_DEG) / Math.PI;
  return { space: 'oklch', l, c: Math.hypot(a, b), h: (angle + FULL_TURN_DEG) % FULL_TURN_DEG };
}

const PARSERS = new Map<string, Parser>([
  ['rgb', rgb],
  ['rgba', rgb],
  ['oklch', oklch],
  ['oklab', oklab],
  ['color', colorFunction],
]);

/** Composantes d'une fonction CSS : séparateurs virgule ou espace, opacité après `/` ignorée. */
const tokens = (args: string): string[] =>
  (args.split('/')[0] ?? '').split(/[\s,]+/).filter(Boolean);

/**
 * Analyse `text` en couleur sRGB ou OKLCH.
 * @throws MilestonesError `unsupported-color` si le format n'est pas pris en charge.
 */
export function parseColor(text: string): ThemeColor {
  const match = FUNCTION.exec(text.trim().toLowerCase());
  const parse = match?.[1] === undefined ? undefined : PARSERS.get(match[1]);
  const color = match?.[2] === undefined ? null : (parse?.(tokens(match[2])) ?? null);
  if (!color) throw new MilestonesError('unsupported-color', text);
  return color;
}
