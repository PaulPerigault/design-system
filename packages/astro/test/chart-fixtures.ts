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

const categories = (
  labels: string[],
  columns: { id: string; label: string; unit?: string; values: (number | null)[] }[],
): Dataset => ({
  schema: 1,
  x: { kind: 'category', label: 'Pays', values: labels },
  series: columns.map(({ unit = '', ...rest }) => ({ ...rest, unit })),
});

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'];

/** Une série, cinq catégories. */
export const barsSimple = (): Dataset =>
  categories(COUNTRIES, [
    { id: 'v', label: 'Visites', unit: 'visites', values: [1240, 860, 640, 410, 95] },
  ]);

/** Trois séries groupées. */
export const barsGrouped = (): Dataset =>
  categories(COUNTRIES, [
    { id: 'a', label: '2024', unit: 'visites', values: [1100, 720, 580, 360, 80] },
    { id: 'b', label: '2025', unit: 'visites', values: [1240, 860, 640, 410, 95] },
    { id: 'c', label: '2026', unit: 'visites', values: [1390, 910, 600, 480, 120] },
  ]);

/** Libellés longs, pour des barres horizontales. */
export const barsLongLabels = (): Dataset =>
  categories(
    [
      'Direction des systèmes d’information et du numérique',
      'Ressources humaines',
      'Service juridique, conformité et protection des données',
      'Achats',
      'Communication',
    ],
    [{ id: 'b', label: 'Budget', unit: 'k€', values: [820, 310, 275, 190, 140] }],
  );

/** Valeurs négatives et trous. */
export const barsNegativeGaps = (): Dataset =>
  categories(
    ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    [
      { id: 'r', label: 'Résultat', unit: 'k€', values: [42, -18, null, -35, 27, null] },
      { id: 'p', label: 'Prévision', unit: 'k€', values: [30, 10, -12, -20, 15, 22] },
    ],
  );

/** Jeu réaliste de `count` catégories et `series` séries (budgets de poids). */
export const barsLarge = (count: number, series: number): Dataset =>
  categories(
    Array.from({ length: count }, (_, i) => `Catégorie ${i + 1}`),
    Array.from({ length: series }, (_, s) => ({
      id: `s${s}`,
      label: `Série ${s + 1}`,
      unit: '€',
      values: wave(count, 100 + 20 * s, 3 + s),
    })),
  );
