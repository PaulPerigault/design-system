// Vecteurs de parité de l'agrégation : calculés par `aggregate` (TypeScript), relus par
// `crates/pp-data/tests/parity.rs`. JSON n'a ni NaN ni Infinity et `null` y veut dire « manquant » :
// une valeur non finie s'écrit « NaN » ou « Infinity » (texte) dans `series`, relue par les deux côtés.
import { aggregate } from '../../packages/dataviz/src/domain/aggregate/aggregate.ts';

const OPERATIONS = ['sum', 'mean', 'min', 'max', 'count', 'first', 'last'];
const MODULUS = 2 ** 31;
const MULTIPLIER = 1103515245;
const INCREMENT = 12345;
const SPAN = 2000;
const SCALE = 10;
const OFFSET = 100;
const GROUPS = 12;

function noise(length, seed) {
  let state = seed;
  return Array.from({ length }, () => {
    state = (state * MULTIPLIER + INCREMENT) % MODULUS;
    return ((state >> 8) % SPAN) / SCALE - OFFSET;
  });
}

const revive = (value) => (typeof value === 'string' ? Number(value) : value);
const KIND = { category: 'category', day: 'time', month: 'time', year: 'time' };

function aggregateCase(name, [by, operation], x, series) {
  const dataset = {
    schema: 1,
    x: { kind: KIND[by], label: 'x', values: x },
    series: series.map((values, index) => ({
      id: `s${index}`,
      label: `S${index}`,
      unit: '',
      values: values.map(revive),
    })),
  };
  const result = aggregate(dataset, { by, operation });
  const expected = result.ok
    ? { labels: result.value.x.values, series: result.value.series.map((s) => s.values) }
    : null;
  return { name, by, operation, x, series, expected, error: result.ok ? null : result.error.code };
}

const letters = (length) => Array.from({ length }, (_, i) => `g${(i * 7) % GROUPS}`);
const days = [
  '2026-01-05',
  '2026-01-20T10:30Z',
  '2026-02-01',
  '2025-12-31T23:59:59Z',
  '2024-02-29',
];
const loose = ['2026-10', '2026', '2026-10-28', '2026-10-01T00:00Z', '2026-11'];

function valid() {
  const basic = ['b', 'a', 'b', 'c', 'a', 'b'];
  const rows = [
    [1, null, 4, null, -2.5, 3],
    [null, null, null, null, null, null],
  ];
  const time = (by) =>
    OPERATIONS.map((op) => aggregateCase(`${by} ${op}`, [by, op], days, [[1, 2, null, 4, 5]]));
  return [
    ...OPERATIONS.map((op) => aggregateCase(`catégories ${op}`, ['category', op], basic, rows)),
    ...OPERATIONS.map((op) =>
      aggregateCase(`bruit ${op}`, ['category', op], letters(300), [noise(300, 9)]),
    ),
    ...['day', 'month', 'year'].flatMap(time),
    aggregateCase('dates moins précises par jour', ['day', 'sum'], loose, [[1, 2, 3, 4, 5]]),
    aggregateCase('dates moins précises par mois', ['month', 'count'], loose, [[1, null, 3, 4, 5]]),
    aggregateCase('un point', ['category', 'mean'], ['a'], [[7]]),
    aggregateCase('que des null', ['category', 'count'], ['a', 'a'], [[null, null]]),
  ];
}

function refused() {
  const sum = (name, by, x, series) => aggregateCase(name, [by, 'sum'], x, series);
  return [
    sum('axe vide', 'category', [], [[]]),
    sum('aucune série', 'category', ['a'], []),
    sum('longueurs différentes', 'category', ['a', 'b'], [[1]]),
    sum('valeur NaN', 'category', ['a', 'b'], [[1, 'NaN']]),
    sum('valeur infinie', 'category', ['a'], [['Infinity']]),
    sum('forme avant valeurs', 'category', ['a', 'b'], [['NaN'], [1, 2]]),
    sum('jour inexistant', 'day', ['2026-02-30'], [[1]]),
    sum('année avant 100', 'year', ['0050-01-01'], [[1]]),
    sum('texte', 'month', ['demain'], [[1]]),
    sum('mois 13', 'month', ['2026-13'], [[1]]),
    sum('heure 24', 'day', ['2026-10-28T24:00Z'], [[1]]),
    sum('sans Z', 'day', ['2026-10-28T09:00'], [[1]]),
    sum('29 février hors bissextile', 'day', ['2025-02-29'], [[1]]),
    sum('valeurs avant dates', 'day', ['2026-02-30'], [['NaN']]),
  ];
}

export const aggregateCases = () => [...valid(), ...refused()];
