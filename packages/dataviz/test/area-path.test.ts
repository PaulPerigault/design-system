import { describe, expect, it } from 'vitest';
import { areaPath } from '../src/domain/geometry/area-path.ts';
import { relativeCurve, round1 } from '../src/domain/geometry/relative-curve.ts';
import type { Result } from '../src/domain/result.ts';

const get = <T>(result: Result<T>): T => {
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const at = (x: number, y: number | null) => ({ x, y });

describe('areaPath', () => {
  it('ferme l’aire sur la ligne de base, de la dernière abscisse à la première', () => {
    expect(get(areaPath([at(0, 10), at(5, 20), at(10, 0)], 50)).d).toBe('M0 10l5 10 5-20V50H0z');
  });
  it('rompt l’aire à chaque valeur manquante : un sous-chemin fermé par segment', () => {
    const points = [at(0, 1), at(1, 2), at(2, null), at(3, 4), at(4, 5), at(5, null)];
    expect(get(areaPath(points, 9)).d).toBe('M0 1l1 1V9H0zM3 4l1 1V9H3z');
  });
  it('ne trace rien au travers d’un trou et signale le point isolé', () => {
    const geometry = get(areaPath([at(0, 3), at(1, null), at(2, 4), at(3, 5)], 9));
    expect(geometry.d).toBe('M2 4l1 1V9H2z');
    expect(geometry.isolated).toEqual([{ x: 0, y: 3 }]);
  });
  it('gère série vide, tout manquant, un seul point et une base au-dessus de la courbe', () => {
    expect(get(areaPath([], 9)).d).toBe('');
    expect(get(areaPath([at(0, null), at(1, null)], 9)).d).toBe('');
    expect(get(areaPath([at(1, 2)], 9)).isolated).toHaveLength(1);
    expect(get(areaPath([at(0, 8), at(1, 8)], 2)).d).toBe('M0 8l1 0V2H0z');
  });
  it('arrondit à une décimale sans -0', () => {
    expect(get(areaPath([at(-0.001, 1.239), at(1, 2)], 3)).d).toBe('M0 1.2l1 0.8V3H0z');
  });
  it('refuse une coordonnée ou une base non finie', () => {
    for (const result of [areaPath([at(Number.NaN, 1)], 0), areaPath([at(0, 1)], Infinity)]) {
      expect(!result.ok && result.error.code).toBe('geometry.bad-input');
    }
  });
});

describe('areaPath (contour supérieur)', () => {
  it('ne garde que la courbe : ni verticale, ni base, ni fermeture', () => {
    expect(get(areaPath([at(0, 10), at(5, 20), at(10, 0)], 50)).top).toBe('M0 10l5 10 5-20');
  });
  it('compte un sous-chemin par segment continu et ignore le point isolé', () => {
    const points = [at(0, 3), at(1, null), at(2, 4), at(3, 5), at(4, null), at(5, 1), at(6, 2)];
    expect(get(areaPath(points, 9)).top).toBe('M2 4l1 1M5 1l1 1');
  });
  it('est vide sans segment', () => {
    expect(get(areaPath([at(0, null), at(1, 2)], 9)).top).toBe('');
  });
});

describe('relativeCurve', () => {
  const walk = (d: string): { x: number; y: number }[] => {
    const numbers = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numbers.length; i += 2) {
      const [dx, dy] = [numbers[i] ?? 0, numbers[i + 1] ?? 0];
      const last = points.at(-1);
      points.push(last ? { x: round1(last.x + dx), y: round1(last.y + dy) } : { x: dx, y: dy });
    }
    return points;
  };

  it('restitue exactement les points arrondis, sans dérive sur 500 points', () => {
    const segment = Array.from({ length: 500 }, (_, i) => ({
      x: 72 + i * 0.6561,
      y: 100 + 60 * Math.sin(i / 7) + (i % 3) * 0.049,
    }));
    const points = walk(relativeCurve(segment));
    expect(points).toHaveLength(segment.length);
    points.forEach((point, i) => {
      expect(point.x).toBeCloseTo(round1(segment[i]?.x ?? 0), 5);
      expect(point.y).toBeCloseTo(round1(segment[i]?.y ?? 0), 5);
    });
  });
  it('colle un pas négatif au nombre précédent et sépare les autres par une espace', () => {
    const segment = [
      { x: 0, y: 5 },
      { x: 2, y: 3 },
      { x: 3, y: 3.4 },
    ];
    expect(relativeCurve(segment)).toBe('M0 5l2-2 1 0.4');
  });
  it('écrit un seul point sans pas et rien sans point', () => {
    expect(relativeCurve([{ x: 1, y: 2 }])).toBe('M1 2');
    expect(relativeCurve([])).toBe('');
  });
  it('est plus court que les coordonnées absolues pour une courbe réelle', () => {
    const segment = Array.from({ length: 250 }, (_, i) => ({ x: 72 + i * 1.31, y: 90 + (i % 17) }));
    const absolute = segment
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y}`)
      .join('');
    expect(relativeCurve(segment).length).toBeLessThan(absolute.length * 0.7);
  });
});
