import { describe, expect, it } from 'vitest';
import { niceTicks } from '../src/domain/scale/ticks.ts';
import { timeTicks } from '../src/domain/scale/time-ticks.ts';
import { timeDomain, timeScale } from '../src/domain/scale/time.ts';

const ticks = (min: number, max: number, target = 5) => {
  const result = niceTicks(min, max, target);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const day = (text: string): number => Date.parse(`${text}T00:00:00Z`);

describe('niceTicks', () => {
  it('choisit des pas en 1, 2, 5 × 10^n', () => {
    expect(ticks(0, 100).values).toEqual([0, 50, 100]);
    expect(ticks(0, 100, 6).values).toEqual([0, 20, 40, 60, 80, 100]);
  });
  it.each([
    [0, 10],
    [0, 1],
    [0, 97],
    [3, 4.2],
  ])('domaine %s à %s', (min, max) => {
    const { step, values } = ticks(min, max);
    expect([1, 2, 5]).toContain(Number((step / 10 ** Math.floor(Math.log10(step))).toFixed(6)));
    expect(values[0]).toBeLessThanOrEqual(min);
    expect(values[values.length - 1]).toBeGreaterThanOrEqual(max);
  });
  it('évite les artefacts flottants', () => {
    expect(ticks(0, 0.3, 4).values).toEqual([0, 0.1, 0.2, 0.3]);
  });
  it('gère les domaines négatifs et à cheval sur zéro', () => {
    expect(ticks(-30, 70, 6).values).toEqual([-40, -20, 0, 20, 40, 60, 80]);
    expect(ticks(-9, -1, 5).domain[1]).toBeLessThanOrEqual(0);
  });
  it('élargit un domaine confondu, nul ou non', () => {
    const flat = ticks(7, 7);
    expect(flat.values[0]).toBeLessThan(7);
    expect(flat.values[flat.values.length - 1]).toBeGreaterThan(7);
    expect(ticks(0, 0).values).toContain(0);
  });
  it('couvre de très grands et très petits ordres de grandeur', () => {
    expect(ticks(0, 1e9).values).toEqual([0, 5e8, 1e9]);
    expect(ticks(0, 1e-6).values.length).toBeGreaterThan(2);
  });
  it.each([
    [1, 0, 5],
    [0, Number.NaN, 5],
    [0, 1, 0],
  ])('refuse %s, %s, cible %s', (a, b, c) => {
    const result = niceTicks(a, b, c);
    expect(!result.ok && result.error.code).toBe('scale.bad-domain');
  });
});

describe('timeDomain et timeScale', () => {
  it('prend le premier et le dernier instant, dans le désordre', () => {
    const domain = timeDomain(['2026-03', '2026-01', '2026-02']);
    expect(domain.ok && domain.value).toEqual([Date.UTC(2026, 0), Date.UTC(2026, 2)]);
  });
  it('refuse une date invalide avec son chemin, et une liste vide', () => {
    const bad = timeDomain(['2026-01', 'hier']);
    expect(!bad.ok && [bad.error.code, bad.error.path]).toEqual(['dataset.bad-date', 'values[1]']);
    expect(timeDomain([]).ok).toBe(false);
  });
  it('projette linéairement', () => {
    const scale = timeScale([day('2026-01-01'), day('2026-01-03')], [0, 100]);
    expect(scale.ok && scale.value.map(day('2026-01-02'))).toBe(50);
  });
});

describe('timeTicks', () => {
  const pick = (a: string, b: string, target = 6) => {
    const result = timeTicks(day(a), day(b), target);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  it('prend le jour sur quelques jours', () => {
    const r = pick('2026-10-26', '2026-10-30', 6);
    expect([r.unit, r.values.length]).toEqual(['day', 5]);
  });
  it('aligne les semaines sur le lundi', () => {
    const r = pick('2026-10-01', '2026-10-31', 6);
    expect(r.unit).toBe('week');
    expect(r.values.every((v) => new Date(v).getUTCDay() === 1)).toBe(true);
  });
  it('aligne les mois sur le 1er et les années sur le 1er janvier', () => {
    const months = pick('2026-01-15', '2026-07-20', 8);
    expect(months.unit).toBe('month');
    expect(months.values.every((v) => new Date(v).getUTCDate() === 1)).toBe(true);
    const years = pick('2018-06-01', '2026-06-01', 6);
    expect(years.unit).toBe('year');
    expect(years.values.every((v) => new Date(v).getUTCMonth() === 0)).toBe(true);
  });
  it('aligne les pas pluriannuels sur leurs multiples', () => {
    const r = pick('1987-03-01', '2026-06-01', 6);
    expect(r.step).toBe(10);
    expect(r.values.map((v) => new Date(v).getUTCFullYear())).toEqual([1990, 2000, 2010, 2020]);
  });
  it('gère une date unique et les dates avant 1970', () => {
    expect(pick('2026-10-28', '2026-10-28').values).toEqual([day('2026-10-28')]);
    const old = pick('1969-12-22', '1970-01-12', 6);
    expect(old.values.every((v) => new Date(v).getUTCDay() === 1)).toBe(true);
  });
  it('refuse début > fin', () => {
    expect(timeTicks(2, 1, 5).ok).toBe(false);
  });
});
