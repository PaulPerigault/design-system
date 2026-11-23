import { describe, expect, it } from 'vitest';
import { centerDifference, changedShare, supportColor } from './patch.ts';
import type { Image } from './png.ts';

const SIZE = 100;
const paint = (fill: (x: number, y: number) => [number, number, number]): Image => {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const [r, g, b] = fill(i % SIZE, Math.floor(i / SIZE));
    data.set([r, g, b, 255], i * 4);
  }
  return { width: SIZE, height: SIZE, data };
};
const disc = { x: 50, y: 50, radius: 40 };
const bare = paint(() => [230, 230, 230]);
const badge = paint((x, y) => (Math.hypot(x - 50, y - 50) < 25 ? [40, 40, 40] : [230, 230, 230]));

describe('patch', () => {
  it('lit la couleur du support nu', () => {
    expect(supportColor(bare, disc)).toEqual([230, 230, 230]);
    expect(supportColor(badge, disc)).toEqual([230, 230, 230]);
  });

  it('mesure la part du centre qui diffère du support', () => {
    expect(centerDifference(bare, disc, [230, 230, 230], 10)).toBe(0);
    expect(centerDifference(badge, disc, [230, 230, 230], 10)).toBeGreaterThan(0.5);
  });

  it('compare deux captures', () => {
    expect(changedShare(bare, bare, 0)).toBe(0);
    expect(changedShare(bare, badge, 10)).toBeGreaterThan(0.1);
  });
});
