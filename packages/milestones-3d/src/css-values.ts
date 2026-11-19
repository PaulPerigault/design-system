// Durées et courbes lues dans les jetons : du texte CSS, analysé, jamais recopié.
import type { Curve } from './types.ts';

const DURATION = /^(\d*\.?\d+)(ms|s)$/;
const MS_PER_S = 1000;
const CURVE_POINTS = 4;
const BEZIER_OPEN = 'cubic-bezier(';

/* eslint-disable @typescript-eslint/no-magic-numbers -- points de contrôle définis par CSS Easing Level 1 */
const KEYWORDS: Readonly<Record<string, Curve>> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};
/* eslint-enable @typescript-eslint/no-magic-numbers */

/** `160ms`, `0.16s`, `0ms` en millisecondes ; `null` pour tout autre texte. */
export function parseDuration(text: string): number | null {
  const match = DURATION.exec(text.trim());
  if (!match) return null;
  const value = Number(match[1]);
  return match[2] === 's' ? value * MS_PER_S : value;
}

const unit = (x: number): boolean => x >= 0 && x <= 1;

type Four = [number, number, number, number];
const isFour = (values: number[]): values is Four =>
  values.length === CURVE_POINTS && values.every(Number.isFinite);

function bezier(args: string): Curve | null {
  const numbers = args
    .split(',')
    .map((part) => (part.trim() === '' ? Number.NaN : Number(part.trim())));
  if (!isFour(numbers)) return null;
  const [x1, y1, x2, y2] = numbers;
  return unit(x1) && unit(x2) ? [x1, y1, x2, y2] : null;
}

/** `cubic-bezier(…)` ou mot-clé ; `null` pour une courbe non reconnue (`steps()`, texte libre). */
export function parseEasing(text: string): Curve | null {
  const clean = text.trim().toLowerCase();
  if (clean.startsWith(BEZIER_OPEN) && clean.endsWith(')')) {
    return bezier(clean.slice(BEZIER_OPEN.length, -1).trim());
  }
  return Object.hasOwn(KEYWORDS, clean) ? (KEYWORDS[clean] ?? null) : null;
}
