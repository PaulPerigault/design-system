// Parité du paquet construit (dist/ + .wasm) avec la référence TypeScript de `dataviz` : mêmes
// vecteurs que crates/pp-data/tests/parity.rs (parity.json), mêmes seuils (ADR-0007, décision 1 :
// 1e-9 en relatif ; indices LTTB et groupes identiques ; mêmes codes d'erreur).
import type { Dataset } from '@paulperigault/dataviz';
import { beforeAll, expect, it } from 'vitest';
import { loadBuilt, nanIfNull, vectors, whenBuilt } from './support.ts';
import type { Api, Vectors } from './support.ts';

const TOLERANCE = 1e-9;

/** Écart relatif |a - b| / max(|a|, |b|), nul si les deux sont nuls. */
const gap = (actual: number, expected: number): number => {
  const scale = Math.max(Math.abs(actual), Math.abs(expected));
  return scale > 0 ? Math.abs(actual - expected) / scale : 0;
};

/** Jeu de données du cas : l'axe est `category` pour `category`, `time` sinon ; « NaN » est un texte. */
function datasetOf(item: Vectors['aggregates'][number]): Dataset {
  return {
    schema: 1,
    x: { kind: item.by === 'category' ? 'category' : 'time', label: 'x', values: item.x },
    series: item.series.map((values, index) => ({
      id: `s${index}`,
      label: `S${index}`,
      unit: '',
      values: values.map((value) => (typeof value === 'string' ? Number(value) : value)),
    })),
  };
}

type Item = Vectors['aggregates'][number];
type Verdict = { ok: true } | { ok: false; error: { code: string } };

const codeOf = (result: Verdict): string => (result.ok ? 'ok' : result.error.code);

/** Plus grand écart relatif entre deux listes de même longueur ; `null` d'un côté seulement : infini. */
function worstGap(
  actual: readonly (number | null)[],
  expected: readonly (number | null)[],
): number {
  let worst = actual.length === expected.length ? 0 : Infinity;
  for (const [index, want] of expected.entries()) {
    const got = actual[index] ?? null;
    if (got === null || want === null) worst = got === want ? worst : Infinity;
    else worst = Math.max(worst, gap(got, want));
  }
  return worst;
}

function aggregateGap(api: Api, item: Item): number {
  const result = api.createWasmAggregator().aggregate(datasetOf(item), item);
  if (!result.ok || !item.expected) return Infinity;
  const labels = JSON.stringify(result.value.x.values) === JSON.stringify(item.expected.labels);
  const gaps = result.value.series.map((series, row) =>
    worstGap(series.values, item.expected?.series[row] ?? []),
  );
  return labels ? Math.max(0, ...gaps) : Infinity;
}

whenBuilt('parité avec la référence TypeScript (parity.json)', () => {
  let api: Api;
  beforeAll(async () => {
    api = await loadBuilt();
  });

  it('quantiles de type 7 à 1e-9 en relatif, mêmes refus', () => {
    let worst = 0;
    for (const item of vectors().quantiles) {
      const result = api.quantiles(nanIfNull(item.values), nanIfNull(item.probabilities));
      expect(codeOf(result), item.name).toBe(item.error ?? 'ok');
      if (result.ok) worst = Math.max(worst, worstGap(result.value, item.expected ?? []));
    }
    expect(worst).toBeLessThanOrEqual(TOLERANCE);
  });

  it('LTTB : indices identiques, mêmes refus', () => {
    const { lttb } = vectors();
    expect(lttb.length).toBeGreaterThanOrEqual(19);
    for (const item of lttb) {
      const result = api.lttb(nanIfNull(item.xs), item.values, item.target);
      expect(codeOf(result), item.name).toBe(item.error ?? 'ok');
      if (result.ok) expect(result.value, item.name).toEqual(item.expected);
    }
  });

  it('agrégation : mêmes groupes, valeurs à 1e-9 en relatif, mêmes refus', () => {
    const { aggregates } = vectors();
    expect(aggregates.length).toBeGreaterThanOrEqual(50);
    let worst = 0;
    for (const item of aggregates) {
      const result = api.createWasmAggregator().aggregate(datasetOf(item), item);
      expect(codeOf(result), item.name).toBe(item.error ?? 'ok');
      if (result.ok) worst = Math.max(worst, aggregateGap(api, item));
    }
    expect(worst).toBeLessThanOrEqual(TOLERANCE);
  });
});
