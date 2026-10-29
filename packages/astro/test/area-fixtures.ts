import type { Dataset } from '@paulperigault/dataviz';
import { daily, wave } from './chart-fixtures';

/** Aires empilées : `series` séries de `points` points quotidiens, toutes positives. */
export const areasLarge = (points: number, series: number): Dataset =>
  daily(
    points,
    Array.from({ length: series }, (_, i) => ({
      id: `s${i}`,
      label: `Canal ${i + 1}`,
      unit: 'visites',
      values: wave(points, 80 + 30 * i, 11 + i),
    })),
  );

/** Trois séries dont une a des trous, pour les ruptures de couche. */
export const areasWithGaps = (): Dataset => {
  const values: (number | null)[] = wave(30, 90, 17);
  for (const hole of [10, 11, 22]) values[hole] = null;
  return daily(30, [
    { id: 'a', label: 'France', unit: 'visites', values: wave(30, 140, 1) },
    { id: 'b', label: 'Belgique', unit: 'visites', values },
    { id: 'c', label: 'Suisse', unit: 'visites', values: wave(30, 60, 13) },
  ]);
};
