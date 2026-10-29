import { describe, expect, it } from 'vitest';
import { extremesOf } from '../src/domain/sparkline/extremes.ts';
import { MAX_SPARKLINE_POINTS, keptIndices } from '../src/domain/sparkline/reduce.ts';

const run = (values: (number | null)[]) => {
  const extremes = extremesOf(values);
  if (extremes === null) throw new Error('série vide');
  return keptIndices(
    values.map((_, i) => i),
    values,
    extremes,
  );
};
const noise = (n: number) => Array.from({ length: n }, (_, i) => Math.sin(i / 7) * 10 + (i % 5));

describe('réduction de sparkline', () => {
  it('garde tout sous la limite', () => {
    const result = run(noise(MAX_SPARKLINE_POINTS));
    expect(result.ok && result.value.length).toBe(MAX_SPARKLINE_POINTS);
  });

  it('réduit au-delà, croissant, avec les vrais extrêmes', () => {
    const values = noise(500);
    const result = run(values);
    const indices = result.ok ? result.value : [];
    const extremes = extremesOf(values);
    expect(indices.length).toBeLessThanOrEqual(MAX_SPARKLINE_POINTS + 2);
    expect(indices.slice(1).every((v, i) => v > (indices[i] ?? Infinity))).toBe(true);
    expect(indices).toContain(extremes?.min.index);
    expect(indices).toContain(extremes?.max.index);
  });

  it('trop de trous : sparkline.too-many-gaps, avec conseil', () => {
    const values = Array.from({ length: 500 }, (_, i) => (i % 2 === 0 ? i : null));
    const result = run(values);
    expect(!result.ok && result.error.code).toBe('sparkline.too-many-gaps');
    expect(!result.ok && result.error.message).toContain('agrégez');
  });
});
