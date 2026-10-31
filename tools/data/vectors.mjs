// Vecteurs de parité de `pp-data` : calculés par la référence TypeScript (`packages/dataviz`),
// relus par les tests Rust `crates/pp-data/tests/parity_*.rs`. Les entrées viennent d'un
// générateur congruentiel entier : aucune fonction transcendante, donc les mêmes octets partout.
import { lttb } from '../../packages/dataviz/src/domain/downsample/lttb.ts';
import { aggregateCases } from './aggregate-vectors.mjs';
import { quantiles } from '../../packages/dataviz/src/domain/stats/quantile.ts';

const MODULUS = 2 ** 31;
const MULTIPLIER = 1103515245;
const INCREMENT = 12345;
const SPAN = 2000;
const SCALE = 10;
const OFFSET = 100;
const PROBABILITIES = [0, 0.01, 0.1, 0.25, 0.3333333333333333, 0.5, 0.75, 0.9, 0.99, 1];

/** Suite pseudo-aléatoire reproductible de valeurs dans [-100 ; 100[ au dixième. */
function series(length, seed) {
  let state = seed;
  return Array.from({ length }, () => {
    state = (state * MULTIPLIER + INCREMENT) % MODULUS;
    return ((state >> 8) % SPAN) / SCALE - OFFSET;
  });
}

const failure = (result) => (result.ok ? null : result.error.code);

// JSON n'a ni NaN ni Infinity : ils sortent en `null` (l'entrée d'un cas d'erreur ; les tests Rust
// relisent `null` comme `NaN`). `quantiles` rend un seul tri pour toutes les probabilités.
function quantileCase(name, values, probabilities) {
  const result = quantiles(values, probabilities);
  return {
    name,
    values,
    probabilities,
    expected: result.ok ? result.value : null,
    error: failure(result),
  };
}

function quantileCases() {
  const inputs = [
    ['un point', [7]],
    ['deux points', [2, 1]],
    ['de 1 à 10', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
    ['valeurs répétées', [3, 3, 3, 1, 1, 9]],
    ['négatives', [-5, -5, 0, 5, -0.5]],
    ['50 aléatoires', series(50, 1)],
    ['1000 aléatoires', series(1000, 2)],
    ['grandes valeurs', [1e15, 2e15, 3.5e15, -4e15]],
  ];
  return [
    ...inputs.map(([name, values]) => quantileCase(name, values, PROBABILITIES)),
    quantileCase('suite vide', [], [0.5]),
    quantileCase('valeur NaN', [1, Number.NaN], [0.5]),
    quantileCase('valeur infinie', [1, Infinity], [0.5]),
    quantileCase('p négatif', [1, 2], [0.5, -0.1]),
    quantileCase('p supérieur à 1', [1, 2], [1.1]),
    quantileCase('p NaN', [1, 2], [Number.NaN]),
    quantileCase('suite vide et p invalide', [], [2]),
  ];
}

function lttbCase(name, xs, values, target) {
  const result = lttb(xs, values, target);
  return {
    name,
    xs,
    values,
    target,
    expected: result.ok ? result.value : null,
    error: failure(result),
  };
}

const steps = (length) => Array.from({ length }, (_, index) => index);
const withGaps = (values, gaps) => values.map((value, index) => (gaps.has(index) ? null : value));
const irregular = (length) => {
  let x = 0;
  return series(length, 5).map((step) => (x += Math.abs(step) + 1));
};

function lttbs() {
  const big = series(1000, 3);
  const wave = series(400, 8);
  const spike = wave.map((value, index) => (index === 200 ? 1000 : value));
  const gapped = withGaps(wave, new Set([0, 1, 80, 81, 82, 240, 399]));
  return [
    lttbCase('1000 points, cible 100', steps(1000), big, 100),
    lttbCase('400 points, cible 2', steps(400), wave, 2),
    lttbCase('400 points, cible 3', steps(400), wave, 3),
    lttbCase('400 points, cible 399', steps(400), wave, 399),
    lttbCase('pic isolé, cible 50', steps(400), spike, 50),
    lttbCase('300 points, cible 20', steps(300), series(300, 4), 20),
    lttbCase('abscisses irrégulières', irregular(400), series(400, 6), 40),
    lttbCase('valeurs identiques', steps(300), Array(300).fill(5), 20),
    lttbCase('suite vide', [], [], 10),
    lttbCase('un point', [0], [4], 10),
    lttbCase('trois points sous la cible', steps(3), [1, 2, 3], 10),
    lttbCase('trous au début, au milieu et à la fin', steps(400), gapped, 120),
    lttbCase('que des trous', steps(4), [null, null, null, null], 1),
    lttbCase('cible minimale avec trous', steps(400), gapped, 3 * 2 + 4),
    lttbCase('cible trop basse', steps(400), gapped, 9),
    lttbCase('longueurs différentes', [0, 1, 2], [1, 2], 5),
    lttbCase('abscisse NaN', [0, Number.NaN, 2], [1, 2, 3], 5),
    lttbCase('abscisse infinie', [0, Infinity, 2], [1, 2, 3], 5),
    lttbCase('cible non entière', steps(10), series(10, 7), 2.5),
  ];
}

export function buildVectors() {
  return { quantiles: quantileCases(), lttb: lttbs(), aggregates: aggregateCases() };
}
