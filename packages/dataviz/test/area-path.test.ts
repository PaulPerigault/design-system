import { describe, expect, it } from 'vitest';
import { areaPath } from '../src/domain/geometry/area-path.ts';
import type { Result } from '../src/domain/result.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const at = (x: number, y: number | null) => ({ x, y });

describe('areaPath', () => {
  it('ferme l’aire sur la ligne de base, de la dernière abscisse à la première', () => {
    expect(get(areaPath([at(0, 10), at(5, 20), at(10, 0)], 50)).d).toBe('M0 10L5 20L10 0V50H0z');
  });
  it('rompt l’aire à chaque valeur manquante : un sous-chemin fermé par segment', () => {
    const points = [at(0, 1), at(1, 2), at(2, null), at(3, 4), at(4, 5), at(5, null)];
    expect(get(areaPath(points, 9)).d).toBe('M0 1L1 2V9H0zM3 4L4 5V9H3z');
  });
  it('ne trace rien au travers d’un trou et signale le point isolé', () => {
    const geometry = get(areaPath([at(0, 3), at(1, null), at(2, 4), at(3, 5)], 9));
    expect(geometry.d).toBe('M2 4L3 5V9H2z');
    expect(geometry.isolated).toEqual([{ x: 0, y: 3 }]);
  });
  it('gère série vide, tout manquant, un seul point et une base au-dessus de la courbe', () => {
    expect(get(areaPath([], 9)).d).toBe('');
    expect(get(areaPath([at(0, null), at(1, null)], 9)).d).toBe('');
    expect(get(areaPath([at(1, 2)], 9)).isolated).toHaveLength(1);
    expect(get(areaPath([at(0, 8), at(1, 8)], 2)).d).toBe('M0 8L1 8V2H0z');
  });
  it('arrondit à deux décimales sans -0', () => {
    expect(get(areaPath([at(-0.001, 1.239), at(1, 2)], 3)).d).toBe('M0 1.24L1 2V3H0z');
  });
  it('refuse une coordonnée ou une base non finie', () => {
    for (const result of [areaPath([at(Number.NaN, 1)], 0), areaPath([at(0, 1)], Infinity)]) {
      expect(!result.ok && result.error.code).toBe('geometry.bad-input');
    }
  });
});
