import { DECADE, HALF, PAIR } from '../numbers.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

/** Graduations rondes (Heckbert, 1990) : pas en 1, 2, 5 × 10^n. */
export interface Ticks {
  readonly step: number;
  readonly values: readonly number[];
  /** Domaine élargi aux graduations extrêmes qui encadrent les données. */
  readonly domain: readonly [number, number];
}

const FIVE = 5;
const NICE_MANTISSAS = [1, PAIR, FIVE, DECADE] as const;
const TOLERANCE = 1e-9;
const DECIMAL_LIMIT = 100;

/** Plus petite mantisse de {1, 2, 5, 10} au moins égale à celle du pas brut. */
function niceStep(raw: number): number {
  const power = DECADE ** Math.floor(Math.log10(raw));
  const mantissa = raw / power;
  const pick = NICE_MANTISSAS.find((m) => m >= mantissa - TOLERANCE) ?? DECADE;
  return pick * power;
}

const clean = (value: number, step: number): number => {
  const decimals = Math.min(DECIMAL_LIMIT, Math.max(0, -Math.floor(Math.log10(step))));
  return Number(value.toFixed(decimals));
};

const validBounds = (min: number, max: number, target: number): boolean =>
  Number.isFinite(min) && Number.isFinite(max) && min <= max && target >= 1;

/**
 * Graduations couvrant [min ; max] avec environ `target` repères (au moins 2).
 * Domaine réduit à un point : étendue d'une demi-unité de chaque côté (ou de |v|/2).
 * `scale.bad-domain` si les bornes ne sont pas finies ou si min > max.
 */
export function niceTicks(min: number, max: number, target: number): Result<Ticks> {
  if (!validBounds(min, max, target)) {
    return fail('scale.bad-domain', 'Bornes finies, min ≤ max et cible ≥ 1 attendus.', 'domain');
  }
  const half = min === max ? Math.abs(min) * HALF || HALF : 0;
  const low = min - half;
  const high = max + half;
  const step = niceStep((high - low) / Math.max(1, target - 1));
  const first = Math.floor(low / step + TOLERANCE);
  const last = Math.ceil(high / step - TOLERANCE);
  const values = Array.from({ length: last - first + 1 }, (_, i) =>
    clean((first + i) * step, step),
  );
  return ok({ step, values, domain: [values[0] ?? low, values[values.length - 1] ?? high] });
}
