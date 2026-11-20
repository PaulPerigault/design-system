// Valeurs élémentaires d'une couleur CSS : nombres, pourcentages, angles. Fonctions pures.
const VALUE = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|grad|rad|turn)?$/;
const PERCENT = 100;
const FULL_TURN_DEG = 360;
const HALF_TURN_DEG = 180;
const GRAD_PER_TURN = 400;
const DEGREES: Readonly<Record<string, number>> = {
  deg: 1,
  grad: FULL_TURN_DEG / GRAD_PER_TURN,
  rad: HALF_TURN_DEG / Math.PI,
  turn: FULL_TURN_DEG,
};

export const COMPONENTS = 3;
/** CSS Color 4 : 100 % de chroma OKLCH ou d'axe OKLab vaut 0,4. */
export const OK_FULL = 0.4;
export const CHANNEL_MAX = 255;
export { FULL_TURN_DEG, HALF_TURN_DEG };

export type Triple = readonly [number, number, number];

/** Nombre, pourcentage de `full` ou `none` (0) ; `null` si ce n'est pas une valeur sans unité. */
export function value(token: string, full: number): number | null {
  if (token === 'none') return 0;
  const match = VALUE.exec(token);
  if (!match || (match[2] !== undefined && match[2] !== '%')) return null;
  const number = Number(match[1]);
  return match[2] === '%' ? (number * full) / PERCENT : number;
}

/** Teinte en degrés : nombre, angle (`deg`, `grad`, `rad`, `turn`) ou `none` (0). */
export function hue(token: string): number | null {
  if (token === 'none') return 0;
  const match = VALUE.exec(token);
  if (!match || match[2] === '%') return null;
  return Number(match[1]) * (DEGREES[match[2] ?? 'deg'] ?? 1);
}

/** Les trois premières composantes de `parts`, ou `null` s'il en manque ou si l'une échoue. */
export function triple(parts: readonly string[], full: Triple): Triple | null {
  const out: number[] = [];
  for (const [index, token] of parts.slice(0, COMPONENTS).entries()) {
    const found = value(token, full[index] ?? 1);
    if (found === null || !Number.isFinite(found)) return null;
    out.push(found);
  }
  const [a, b, c] = out;
  return a === undefined || b === undefined || c === undefined ? null : [a, b, c];
}
