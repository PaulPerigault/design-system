import { describe, expect, it } from 'vitest';
import type { Result } from '../src/domain/result.ts';
import { bandScale } from '../src/domain/scale/band.ts';
import { linearScale, verticalScale } from '../src/domain/scale/linear.ts';

const value = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('linearScale', () => {
  it('projette le domaine sur l’étendue et inverse', () => {
    const scale = value(linearScale([0, 10], [100, 200]));
    expect(scale.map(5)).toBe(150);
    expect(scale.invert(150)).toBe(5);
  });
  it('accepte les valeurs négatives', () => {
    const scale = value(linearScale([-10, 10], [0, 100]));
    expect([scale.map(-10), scale.map(0), scale.map(10)]).toEqual([0, 50, 100]);
  });
  it('place un domaine confondu au milieu', () => {
    const scale = value(linearScale([3, 3], [0, 100]));
    expect(scale.map(3)).toBe(50);
    expect(scale.invert(10)).toBe(3);
  });
  it('inverse l’axe Y SVG', () => {
    const scale = value(verticalScale([0, 100], 200));
    expect([scale.map(0), scale.map(100)]).toEqual([200, 0]);
  });
  it('refuse un bout non fini', () => {
    const domain = linearScale([0, Number.NaN], [0, 1]);
    const range = linearScale([0, 1], [0, Number.POSITIVE_INFINITY]);
    expect(!domain.ok && domain.error.code).toBe('scale.bad-domain');
    expect(!range.ok && range.error.code).toBe('scale.bad-range');
  });
});

describe('bandScale', () => {
  it('découpe l’étendue en bandes égales avec remplissage', () => {
    const scale = value(bandScale(4, [0, 400], 0.2));
    expect([scale.step, scale.bandwidth, scale.start(0), scale.start(3)]).toEqual([
      100, 80, 10, 310,
    ]);
  });
  it('renvoie une échelle vide sans catégorie', () => {
    const scale = value(bandScale(0, [0, 100]));
    expect([scale.count, scale.step, scale.bandwidth]).toEqual([0, 0, 0]);
  });
  it('lit une étendue décroissante en partant du bord le plus proche du début', () => {
    const scale = value(bandScale(2, [100, 0]));
    expect([scale.start(0), scale.start(1)]).toEqual([50, 0]);
  });
  it.each([
    [-1, [0, 1], 0],
    [1.5, [0, 1], 0],
    [2, [0, 1], 1],
    [2, [0, Number.NaN], 0],
  ] as const)('refuse %s catégories, étendue %j, remplissage %s', (count, range, padding) => {
    expect(bandScale(count, range, padding).ok).toBe(false);
  });
});
