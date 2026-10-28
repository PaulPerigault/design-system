import { describe, expect, it } from 'vitest';
import { lttb } from '../src/domain/downsample/lttb.ts';

const run = (values: (number | null)[], target: number) => {
  const xs = values.map((_, i) => i);
  return lttb(xs, values, target);
};
const wave = Array.from({ length: 1000 }, (_, i) => Math.sin(i / 20) * 50);

describe('lttb', () => {
  it('respecte la cible et garde premier et dernier points', () => {
    const result = run(wave, 100);
    expect(result.ok && result.value.length).toBe(100);
    expect(result.ok && [result.value[0], result.value[99]]).toEqual([0, 999]);
  });
  it('rend des indices croissants et sans doublon', () => {
    const result = run(wave, 77);
    const indices = result.ok ? result.value : [];
    expect(indices.slice(1).every((v, i) => v > (indices[i] ?? Infinity))).toBe(true);
  });
  it('garde un pic isolé', () => {
    const spike = wave.map((v, i) => (i === 500 ? 1000 : v));
    const result = run(spike, 50);
    expect(result.ok && result.value).toContain(500);
  });
  it('garde tout sous la cible, y compris série vide et un point', () => {
    expect(run([], 10)).toEqual({ ok: true, value: [] });
    expect(run([4], 10)).toEqual({ ok: true, value: [0] });
    expect(run([1, 2, 3], 10)).toEqual({ ok: true, value: [0, 1, 2] });
  });
  it('traite des valeurs identiques et négatives', () => {
    expect(run(Array<number>(300).fill(5), 20).ok).toBe(true);
    const negative = run(
      wave.map((v) => v - 100),
      30,
    );
    expect(negative.ok && negative.value.length).toBe(30);
  });
  it('n’invente rien et garde un null par trou : début, milieu, fin', () => {
    const values = [null, ...wave.slice(0, 400), null, null, ...wave.slice(400, 800), null];
    const result = run(values, 60);
    const kept = result.ok ? result.value : [];
    expect(kept.length).toBeLessThanOrEqual(60);
    expect(kept.filter((i) => values[i] === null)).toEqual([0, 401, 803]);
    const first = kept.filter((i) => i >= 1 && i <= 400);
    expect([first[0], first[first.length - 1]]).toEqual([1, 400]);
    const second = kept.filter((i) => i >= 403 && i <= 802);
    expect([second[0], second[second.length - 1]]).toEqual([403, 802]);
  });
  it('partage le budget au prorata et garde les petites suites', () => {
    const values = [...wave.slice(0, 500), null, 1, 2, 3];
    const result = run(values, 40);
    expect(result.ok && result.value.length).toBeLessThanOrEqual(40);
    expect(result.ok && result.value.slice(-3)).toEqual([500, 501, 503]);
  });
  it('refuse une cible trop basse, des longueurs inégales et un x non fini', () => {
    const low = run([1, null, 2, 3], 3);
    expect(!low.ok && low.error.code).toBe('downsample.bad-target');
    expect(lttb([0], [1, 2], 5).ok).toBe(false);
    expect(lttb([Number.NaN], [1], 5).ok).toBe(false);
  });
});
