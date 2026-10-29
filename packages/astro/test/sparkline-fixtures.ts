/** Jeux d'essai des tests Sparkline et KpiCard : valeurs fictives, sans nom propre. */
const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

export const visits = (values: (number | null)[], unit = 'visites') => ({
  schema: 1,
  x: { kind: 'time', label: 'Mois', values: MONTHS.slice(0, values.length) },
  series: [{ id: 'visits', label: 'Visites', unit, values }],
});

export const RISING = visits([120, 150, 140, 210, 260, 340]);
export const WITH_GAP = visits([120, 150, null, 210, 260, 340]);
export const ENDS_ON_GAP = visits([120, 150, 140, 210, 260, null]);
export const ALL_MISSING = visits([null, null, null]);
export const FLAT = visits([80, 80, 80, 80]);

/** Série de `count` points (suite déterministe) pour mesurer le poids. */
export function longSeries(count: number) {
  const values = Array.from({ length: count }, (_, i) => 100 + ((i * 37) % 53) + (i % 7) * 3);
  return {
    schema: 1,
    x: { kind: 'number', label: 'Jour', values: values.map((_, i) => i) },
    series: [{ id: 'daily', label: 'Valeur', unit: '', values }],
  };
}
