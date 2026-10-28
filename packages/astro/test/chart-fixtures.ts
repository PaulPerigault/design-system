import type { Dataset } from '@paulperigault/dataviz';

const DAY_MS = 86_400_000;
const START = Date.UTC(2026, 0, 1);

const isoDay = (offset: number): string =>
  new Date(START + offset * DAY_MS).toISOString().slice(0, 10);

/** Bruit déterministe (congruentiel linéaire) : les jeux d'essai ne changent jamais. */
const noise = (seed: number): number =>
  ((seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648;

/** Série réaliste : tendance, saisonnalité hebdomadaire et bruit. */
export const wave = (points: number, base: number, seed: number): number[] =>
  Array.from(
    { length: points },
    (_, i) =>
      Math.round((base + i * 0.4 + 30 * Math.sin(i / 3.5) + 20 * noise(seed + i)) * 10) / 10,
  );

export const daily = (
  points: number,
  columns: { id: string; label: string; unit?: string; values: (number | null)[] }[],
): Dataset => ({
  schema: 1,
  x: { kind: 'time', label: 'Jour', values: Array.from({ length: points }, (_, i) => isoDay(i)) },
  series: columns.map(({ unit = '', ...rest }) => ({ ...rest, unit })),
});

export const simple = (): Dataset =>
  daily(30, [{ id: 'visites', label: 'Visites', unit: 'visites', values: wave(30, 120, 1) }]);

export const triple = (): Dataset =>
  daily(30, [
    { id: 'a', label: 'France', unit: 'visites', values: wave(30, 140, 1) },
    { id: 'b', label: 'Belgique', unit: 'visites', values: wave(30, 90, 7) },
    { id: 'c', label: 'Suisse', unit: 'visites', values: wave(30, 40, 13) },
  ]);

export const withGaps = (): Dataset => {
  const values: (number | null)[] = wave(30, 120, 3);
  for (const hole of [8, 9, 10, 20]) values[hole] = null;
  return daily(30, [{ id: 'visites', label: 'Visites', unit: 'visites', values }]);
};

export const large = (series: number): Dataset =>
  daily(
    500,
    Array.from({ length: series }, (_, i) => ({
      id: `s${i}`,
      label: `Série ${i + 1}`,
      unit: '€',
      values: wave(500, 100 + 30 * i, 5 + i),
    })),
  );
