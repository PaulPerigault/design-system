export const valid = {
  schema: 1,
  x: { kind: 'time', label: 'Mois', values: ['2026-01', '2026-02', '2026-03'] },
  series: [
    { id: 'ca', label: 'Chiffre d’affaires', unit: '€', values: [1200.5, null, 980] },
    { id: 'marge', unit: '%', values: [12, 14, 13] },
  ],
};
