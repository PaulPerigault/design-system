import { describe, expect, it } from 'vitest';
import { polar, radialLine, sectorPath } from '../src/domain/geometry/arc-path.ts';
import type { Result } from '../src/domain/result.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const C = { x: 100, y: 100 };
const R = { inner: 60, outer: 80 };

describe('polar', () => {
  it('place 0° en haut, 90° à droite, 180° en bas, -90° à gauche', () => {
    const near = (a: number, b: number): void => expect(a).toBeCloseTo(b, 9);
    for (const [angle, x, y] of [
      [0, 100, 20],
      [90, 180, 100],
      [180, 100, 180],
      [-90, 20, 100],
    ] as const) {
      near(polar(C, 80, angle).x, x);
      near(polar(C, 80, angle).y, y);
    }
  });
});

describe('sectorPath', () => {
  it('trace un demi-anneau : arc extérieur, rayon, arc intérieur en retour', () => {
    expect(get(sectorPath(C, R, { from: -90, to: 90 }))).toBe(
      'M20 100A80 80 0 0 1 180 100L160 100A60 60 0 0 0 40 100z',
    );
  });
  it('lève le drapeau grand arc au-delà d’un demi-tour', () => {
    expect(get(sectorPath(C, R, { from: 0, to: 270 }))).toMatch(/^M100 20A80 80 0 1 1 /);
  });
  it('trace un tour entier en anneau évidé, sans arc dégénéré', () => {
    const d = get(sectorPath(C, R, { from: 0, to: 360 }));
    expect(d).toBe(
      'M100 20A80 80 0 0 1 100 180A80 80 0 0 1 100 20zM100 40A60 60 0 0 0 100 160A60 60 0 0 0 100 40z',
    );
  });
  it('refuse des rayons inversés ou nuls, un secteur sans ouverture, une valeur non finie', () => {
    const bad = [
      sectorPath(C, { inner: 80, outer: 60 }, { from: 0, to: 90 }),
      sectorPath(C, { inner: 60, outer: 60 }, { from: 0, to: 90 }),
      sectorPath(C, R, { from: 90, to: 90 }),
      sectorPath(C, R, { from: 0, to: Number.NaN }),
    ];
    for (const result of bad) expect(!result.ok && result.error.code).toBe('geometry.bad-input');
  });
});

describe('radialLine', () => {
  it('trace l’aiguille entre deux rayons à l’angle de la valeur', () => {
    expect(get(radialLine(C, { inner: 50, outer: 90 }, 90))).toBe('M150 100L190 100');
  });
  it('refuse un angle non fini', () => {
    const result = radialLine(C, R, Infinity);
    expect(!result.ok && result.error.code).toBe('geometry.bad-input');
  });
});
