import { describe, expect, it } from 'vitest';
import type { Result } from '../src/domain/result.ts';
import type { BarsInput } from '../src/domain/geometry/bars.ts';
import { barRects, rectsPath } from '../src/domain/geometry/bars.ts';
import { linePath } from '../src/domain/geometry/line-path.ts';
import { bandScale } from '../src/domain/scale/band.ts';
import { linearScale, verticalScale } from '../src/domain/scale/linear.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const at = (x: number, y: number | null) => ({ x, y });

describe('linePath', () => {
  it('trace un segment continu', () => {
    expect(get(linePath([at(0, 10), at(5.123, 20), at(10, 0)])).d).toBe('M0 10L5.12 20L10 0');
  });
  it('rompt la courbe aux valeurs manquantes : début, milieu et fin', () => {
    const points = [at(0, null), at(1, 1), at(2, 2), at(3, null), at(4, 4), at(5, 5), at(6, null)];
    expect(get(linePath(points)).d).toBe('M1 1L2 2M4 4L5 5');
  });
  it('signale les points isolés sans les tracer', () => {
    const geometry = get(linePath([at(0, 3), at(1, null), at(2, 4), at(3, 5)]));
    expect(geometry.d).toBe('M2 4L3 5');
    expect(geometry.isolated).toEqual([{ x: 0, y: 3 }]);
  });
  it('gère série vide, un point, tout manquant, négatifs et -0', () => {
    expect(get(linePath([])).d).toBe('');
    expect(get(linePath([at(1, 2)])).isolated).toHaveLength(1);
    expect(get(linePath([at(0, null), at(1, null)])).d).toBe('');
    expect(get(linePath([at(-0.001, -5), at(1, -5)])).d).toBe('M0 -5L1 -5');
  });
  it('refuse une coordonnée non finie', () => {
    const result = linePath([at(Number.NaN, 1)]);
    expect(!result.ok && result.error.code).toBe('geometry.bad-input');
  });
});

describe('barRects', () => {
  const categories = get(bandScale(2, [0, 200]));
  const values = get(verticalScale([0, 10], 100));
  const vertical = { orientation: 'vertical', categories, values } satisfies Omit<
    BarsInput,
    'series'
  >;

  it('construit des barres verticales depuis la base, Y inversé', () => {
    const rects = get(barRects({ ...vertical, series: [[5, 10]] }));
    expect(rects[0]).toMatchObject({ x: 0, y: 50, width: 100, height: 50 });
    expect(rects[1]).toMatchObject({ x: 100, y: 0, height: 100 });
  });
  it('groupe les séries dans la bande', () => {
    const rects = get(
      barRects({
        ...vertical,
        series: [
          [1, 2],
          [3, 4],
        ],
      }),
    );
    const first = rects.filter((r) => r.index === 0);
    expect(first.map((r) => [r.x, r.width])).toEqual([
      [0, 50],
      [50, 50],
    ]);
  });
  it('construit des barres horizontales', () => {
    const scale = get(linearScale([0, 10], [0, 100]));
    const input: BarsInput = {
      ...vertical,
      orientation: 'horizontal',
      values: scale,
      series: [[5, 10]],
    };
    expect(get(barRects(input))[0]).toMatchObject({ x: 0, y: 0, width: 50, height: 100 });
  });
  it('part de zéro pour les valeurs négatives', () => {
    const signed = get(verticalScale([-10, 10], 100));
    const [rect] = get(barRects({ ...vertical, values: signed, series: [[-5, 5]] }));
    expect(rect).toMatchObject({ y: 50, height: 25 });
  });
  it('laisse un vide pour null et ne dessine rien sans donnée', () => {
    const rects = get(barRects({ ...vertical, series: [[null, 4]] }));
    expect(rects.map((r) => r.index)).toEqual([1]);
    const empty = get(bandScale(0, [0, 100]));
    expect(get(barRects({ ...vertical, categories: empty, series: [] }))).toEqual([]);
  });
  it('refuse des séries de mauvaise longueur', () => {
    const result = barRects({ ...vertical, series: [[1]] });
    expect(!result.ok && result.error.code).toBe('geometry.bad-input');
  });
  it('écrit le chemin des rectangles', () => {
    const rects = get(barRects({ ...vertical, series: [[5, null]] }));
    expect(rectsPath(rects)).toBe('M0 50h100v50h-100z');
  });
});
