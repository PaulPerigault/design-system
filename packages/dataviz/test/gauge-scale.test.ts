import { describe, expect, it } from 'vitest';
import {
  GAUGE_SPANS,
  gaugeReading,
  gaugeZones,
  zoneIndex,
} from '../src/domain/geometry/gauge-scale.ts';
import { ERROR_CODES } from '../src/errors.ts';
import type { Result } from '../src/domain/result.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const codeOf = (result: Result<unknown>): string | undefined =>
  result.ok ? undefined : result.error.code;
const HALF = GAUGE_SPANS.half;

describe('gaugeReading', () => {
  it('place la valeur sur l’arc : minimum à gauche, milieu en haut, maximum à droite', () => {
    expect(get(gaugeReading(0, [0, 100], HALF)).angle).toBe(-90);
    expect(get(gaugeReading(50, [0, 100], HALF)).angle).toBe(0);
    expect(get(gaugeReading(100, [0, 100], HALF)).angle).toBe(90);
    expect(get(gaugeReading(25, [0, 100], GAUGE_SPANS.full)).angle).toBe(90);
  });
  it('borne une valeur hors intervalle et le dit', () => {
    const above = get(gaugeReading(120, [0, 100], HALF));
    expect(above).toMatchObject({ value: 100, clamped: 'above', angle: 90 });
    const below = get(gaugeReading(-5, [0, 100], HALF));
    expect(below).toMatchObject({ value: 0, clamped: 'below', angle: -90 });
    expect(get(gaugeReading(100, [0, 100], HALF)).clamped).toBeNull();
  });
  it('lit un intervalle négatif ou décalé', () => {
    expect(get(gaugeReading(0, [-50, 50], HALF)).fraction).toBe(0.5);
    expect(get(gaugeReading(15, [10, 20], HALF)).angle).toBe(0);
  });
  it('refuse un intervalle nul ou inversé, une valeur ou un bord non finis', () => {
    expect(codeOf(gaugeReading(1, [5, 5], HALF))).toBe('gauge.bad-range');
    expect(codeOf(gaugeReading(1, [10, 0], HALF))).toBe('gauge.bad-range');
    expect(codeOf(gaugeReading(Number.NaN, [0, 1], HALF))).toBe('geometry.bad-input');
    expect(codeOf(gaugeReading(1, [0, Infinity], HALF))).toBe('geometry.bad-input');
  });
});

describe('gaugeZones', () => {
  it('découpe en n + 1 zones contiguës dont les angles se suivent', () => {
    const zones = get(gaugeZones([40, 80], [0, 100], HALF));
    expect(zones.map((z) => [z.from, z.to])).toEqual([
      [0, 40],
      [40, 80],
      [80, 100],
    ]);
    expect(zones[0]?.span.from).toBe(-90);
    expect(zones[1]?.span.from).toBeCloseTo(zones[0]?.span.to ?? Number.NaN, 9);
    expect(zones[2]?.span.to).toBe(90);
  });
  it('donne une zone unique sans seuil', () => {
    expect(get(gaugeZones([], [0, 100], HALF))).toHaveLength(1);
  });
  it.each([
    ['non ordonnés', [80, 40]],
    ['égaux', [40, 40]],
    ['au minimum', [0, 50]],
    ['au maximum', [50, 100]],
    ['hors intervalle', [150]],
    ['non finis', [Number.NaN]],
  ])('refuse des seuils %s', (_name, thresholds) => {
    const result = gaugeZones(thresholds, [0, 100], HALF);
    expect(codeOf(result)).toBe('gauge.bad-thresholds');
    expect(ERROR_CODES).toContain('gauge.bad-thresholds');
  });
  it('désigne le seuil fautif et refuse un intervalle nul', () => {
    const result = gaugeZones([40, 30], [0, 100], HALF);
    expect(!result.ok && result.error.path).toBe('thresholds[1]');
    expect(codeOf(gaugeZones([], [3, 3], HALF))).toBe('gauge.bad-range');
  });
});

describe('zoneIndex', () => {
  const zones = get(gaugeZones([40, 80], [0, 100], HALF));
  it('range une frontière dans la zone du dessus et le maximum dans la dernière', () => {
    expect([0, 39.9, 40, 79.9, 80, 100].map((v) => zoneIndex(zones, v))).toEqual([
      0, 0, 1, 1, 2, 2,
    ]);
  });
});
