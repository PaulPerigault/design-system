import { describe, expect, it } from 'vitest';
import { sparkline } from '../src/domain/sparkline/sparkline.ts';

/** ADR-0007 : sparkline ≤ 1,5 ko ; l'étape V3a-1 borne le chemin à 2 ko, la mesure est plus stricte. */
const BUDGET = 1500;
const size = { width: 120, height: 32 };
const geometry = (values: (number | null)[], extra = {}) => {
  const result = sparkline({ values, ...size, ...extra });
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
};
const walk = (n: number) => {
  let seed = 7;
  let level = 50;
  return Array.from({ length: n }, () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    level += (seed / 2147483648 - 0.5) * 20;
    return level;
  });
};
const bytes = (text: string): number => new TextEncoder().encode(text).length;

describe('sparkline', () => {
  it('tracé simple : bornes, point final, extrêmes, tendance', () => {
    const g = geometry([10, 20, 15, 30]);
    expect(g.d).toMatch(/^M2 30l/);
    expect(g.end).toMatchObject({ index: 3, value: 30, x: 118, y: 2 });
    expect(g.min).toMatchObject({ index: 0, value: 10, x: 2, y: 30 });
    expect(g.max.index).toBe(3);
    expect(g.trend).toMatchObject({ direction: 'up', absolute: 20, relative: 2 });
    expect(g.trailingGap).toBe(false);
  });

  it('un trou rompt le tracé en deux sous-chemins, sans rien inventer', () => {
    const g = geometry([1, 2, null, 4, 5]);
    expect(g.d.match(/M/g)).toHaveLength(2);
    expect(g.missing).toBe(1);
  });

  it('trou final : le point final est la dernière valeur connue', () => {
    const g = geometry([1, 2, 3, null]);
    expect(g.end.index).toBe(2);
    expect(g.trailingGap).toBe(true);
  });

  it('point isolé entre deux trous : marqué, pas tracé', () => {
    const g = geometry([1, 2, null, 5, null, 3, 4]);
    expect(g.isolated).toHaveLength(1);
  });

  it('un seul point : pas de tracé ni de tendance, le point est isolé', () => {
    const g = geometry([7]);
    expect(g.d).toBe('');
    expect(g.isolated).toHaveLength(1);
    expect(g.trend).toBeNull();
  });

  it('série constante : trait au milieu de la hauteur, tendance stable', () => {
    const g = geometry([5, 5, 5]);
    expect(g.end.y).toBe(16);
    expect(g.trend).toMatchObject({ direction: 'flat' });
  });

  it('abscisses fournies : espacement proportionnel', () => {
    const g = geometry([1, 2, 3], { xs: [0, 1, 10] });
    expect(g.min.x).toBe(2);
    expect(g.end.x).toBe(118);
    expect(g.d.startsWith('M2 30l11.6')).toBe(true);
  });

  it('500 points : chemin sous 1,5 ko (donc sous 2 ko), extrêmes sur le tracé', () => {
    const values = walk(500);
    const g = geometry(values);
    expect(bytes(g.d)).toBeLessThan(BUDGET);
    expect(g.min.value).toBe(Math.min(...values));
    expect(g.max.value).toBe(Math.max(...values));
    expect(g.min.y).toBe(30);
    expect(g.max.y).toBe(2);
  });

  it('500 points avec trous : budget tenu', () => {
    const values = walk(500).map((v, i) => (i % 97 === 0 ? null : v));
    expect(bytes(geometry(values).d)).toBeLessThan(BUDGET);
  });

  it('propage les erreurs typées', () => {
    const result = sparkline({ values: [null], ...size });
    expect(!result.ok && result.error.code).toBe('sparkline.no-data');
  });
});
