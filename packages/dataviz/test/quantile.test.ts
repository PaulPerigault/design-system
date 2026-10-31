import { describe, expect, it } from 'vitest';
import { quantile, quantiles } from '../src/domain/stats/quantile.ts';

const ONE_TO_TEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const value = (result: ReturnType<typeof quantile>): number | string =>
  result.ok ? result.value : result.error.code;

describe('quantile de type 7', () => {
  it('rend les valeurs de R (quantile(1:10, p), type = 7)', () => {
    expect(value(quantile(ONE_TO_TEN, 0.25))).toBeCloseTo(3.25, 12);
    expect(value(quantile(ONE_TO_TEN, 0.5))).toBeCloseTo(5.5, 12);
    expect(value(quantile(ONE_TO_TEN, 0.9))).toBeCloseTo(9.1, 12);
  });
  it('rend les bornes pour p = 0 et p = 1, et l’unique valeur d’une suite à un point', () => {
    expect(quantile([4, 2, 9], 0)).toEqual({ ok: true, value: 2 });
    expect(quantile([4, 2, 9], 1)).toEqual({ ok: true, value: 9 });
    expect(quantile([7], 0.3)).toEqual({ ok: true, value: 7 });
  });
  it('trie une copie : l’entrée n’est pas modifiée', () => {
    const input = [3, 1, 2];
    quantile(input, 0.5);
    expect(input).toEqual([3, 1, 2]);
  });
  it('accepte des valeurs négatives et répétées', () => {
    expect(quantile([-5, -5, 0, 5], 0.5)).toEqual({ ok: true, value: -2.5 });
  });
  it('calcule plusieurs probabilités en un tri', () => {
    expect(quantiles([1, 2, 3, 4], [0, 0.5, 1])).toEqual({ ok: true, value: [1, 2.5, 4] });
  });
  it('refuse une suite vide, une valeur non finie, une probabilité hors de [0, 1]', () => {
    expect(value(quantile([], 0.5))).toBe('stats.empty');
    expect(value(quantile([1, Number.NaN], 0.5))).toBe('stats.non-finite');
    expect(value(quantile([1, Infinity], 0.5))).toBe('stats.non-finite');
    expect(value(quantile([1, 2], -0.1))).toBe('stats.bad-probability');
    expect(value(quantile([1, 2], 1.1))).toBe('stats.bad-probability');
    expect(value(quantile([1, 2], Number.NaN))).toBe('stats.bad-probability');
  });
  it('contrôle les valeurs avant les probabilités', () => {
    expect(value(quantile([], -1))).toBe('stats.empty');
  });
});
