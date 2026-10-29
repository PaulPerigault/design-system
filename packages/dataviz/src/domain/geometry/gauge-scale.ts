import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { AngleSpan } from './arc-path.ts';
import { PAIR } from '../numbers.ts';
import { FULL_TURN, HALF_TURN } from './arc-path.ts';

export type GaugeShape = 'half' | 'full';
export type GaugeRange = readonly [number, number];

const QUARTER_TURN = HALF_TURN / PAIR;

/** Ouverture de l'arc : demi-cercle de gauche à droite, ou cercle complet depuis midi. */
export const GAUGE_SPANS: Record<GaugeShape, AngleSpan> = {
  half: { from: -QUARTER_TURN, to: QUARTER_TURN },
  full: { from: 0, to: FULL_TURN },
};

export interface GaugeReading {
  /** Valeur ramenée à l'intervalle : c'est elle que l'aiguille désigne. */
  readonly value: number;
  readonly fraction: number;
  readonly angle: number;
  /** Indication de bornage : `below` sous le minimum, `above` au-dessus du maximum. */
  readonly clamped: 'below' | 'above' | null;
}

export interface GaugeZone {
  readonly index: number;
  readonly from: number;
  readonly to: number;
  readonly span: AngleSpan;
}

const finite = (...values: readonly number[]): boolean => values.every(Number.isFinite);

const angleOf = (fraction: number, span: AngleSpan): number =>
  span.from + fraction * (span.to - span.from);

/** Largeur de l'intervalle, ou `gauge.bad-range` s'il est nul ou inversé. */
function widthOf([min, max]: GaugeRange): Result<number> {
  if (!finite(min, max)) return fail('geometry.bad-input', 'Intervalle non fini.', 'range');
  if (max <= min) return fail('gauge.bad-range', 'L’intervalle doit avoir max > min.', 'range');
  return ok(max - min);
}

/**
 * Lecture d'une valeur sur l'intervalle : valeur bornée, fraction, angle de l'aiguille. Hors
 * intervalle, la valeur est bornée et `clamped` le dit. `gauge.bad-range` si l'intervalle est nul
 * ou inversé.
 */
export function gaugeReading(
  value: number,
  range: GaugeRange,
  span: AngleSpan,
): Result<GaugeReading> {
  const width = widthOf(range);
  if (!width.ok) return width;
  if (!finite(value)) return fail('geometry.bad-input', 'Valeur non finie.', 'value');
  const [min, max] = range;
  const kept = Math.min(Math.max(value, min), max);
  const fraction = (kept - min) / width.value;
  const clamped = value < min ? 'below' : value > max ? 'above' : null;
  return ok({ value: kept, fraction, angle: angleOf(fraction, span), clamped });
}

/**
 * Zones colorées découpées par les seuils (strictement croissants, strictement entre `min` et
 * `max`) : n seuils donnent n + 1 zones contiguës. `gauge.bad-thresholds` si un seuil n'est pas
 * fini, est hors de l'intervalle ou n'est pas supérieur au précédent.
 */
export function gaugeZones(
  thresholds: readonly number[],
  range: GaugeRange,
  span: AngleSpan,
): Result<readonly GaugeZone[]> {
  const width = widthOf(range);
  if (!width.ok) return width;
  const [min, max] = range;
  const bounds = [min, ...thresholds, max];
  const wrong = thresholds.findIndex((t, i) => !(t > (bounds[i] ?? min) && t < max));
  if (wrong >= 0) {
    return fail(
      'gauge.bad-thresholds',
      'Seuils non croissants ou hors de l’intervalle.',
      `thresholds[${wrong}]`,
    );
  }
  const angle = (value: number): number => angleOf((value - min) / width.value, span);
  return ok(
    bounds.slice(1).map((to, index) => {
      const from = bounds[index] ?? min;
      return { index, from, to, span: { from: angle(from), to: angle(to) } };
    }),
  );
}

/** Zone qui contient la valeur : une frontière appartient à la zone du dessus, `max` à la dernière. */
export const zoneIndex = (zones: readonly GaugeZone[], value: number): number =>
  Math.max(
    0,
    zones.findLastIndex((zone) => value >= zone.from),
  );
