// Contrat du paquet construit : erreurs typées sans levée, et mêmes réponses que la référence.
import type { AggregateSpec, Dataset } from '@paulperigault/dataviz';
import { createAggregator } from '@paulperigault/dataviz';
import { beforeAll, expect, it } from 'vitest';
import { loadBuilt, whenBuilt } from './support.ts';
import type { Api } from './support.ts';

const dataset: Dataset = {
  schema: 1,
  x: {
    kind: 'time',
    label: 'Jour',
    values: ['2026-01-05', '2026-01-20', '2026-02-01', '2026-02-03'],
  },
  series: [
    { id: 'a', label: 'A', unit: '€', values: [1, null, 4, 2.5] },
    { id: 'b', label: 'B', unit: '%', values: [null, null, 7, 8] },
  ],
};
const month: AggregateSpec = { by: 'month', operation: 'sum' };

whenBuilt('paquet construit', () => {
  let api: Api;
  beforeAll(async () => {
    api = await loadBuilt();
  });

  it('init() est idempotent et prêt', async () => {
    expect(api.isReady()).toBe(true);
    expect((await api.init()).ok).toBe(true);
  });

  it('agrège comme la référence TypeScript, port Aggregator compris', () => {
    const wasm = api.createWasmAggregator().aggregate(dataset, month);
    expect(wasm).toEqual(createAggregator().aggregate(dataset, month));
    const count = api.createWasmAggregator().aggregate(dataset, { by: 'day', operation: 'count' });
    expect(count).toEqual(createAggregator().aggregate(dataset, { by: 'day', operation: 'count' }));
  });

  it('rend les erreurs de spécification, d’axe et de forme de la référence', () => {
    const run = (data: Dataset, spec: unknown) =>
      api.createWasmAggregator().aggregate(data, JSON.parse(JSON.stringify(spec)));
    const code = (result: ReturnType<typeof run>) => (result.ok ? 'ok' : result.error.code);
    expect(code(run(dataset, { by: 'week', operation: 'sum' }))).toBe('aggregate.bad-spec');
    expect(code(run(dataset, { by: 'category', operation: 'sum' }))).toBe('aggregate.bad-axis');
    const short: Dataset = { ...dataset, series: [{ id: 'a', label: 'A', unit: '', values: [1] }] };
    expect(code(run(short, month))).toBe('dataset.length-mismatch');
    const bad: Dataset = {
      ...dataset,
      x: { kind: 'time', label: 'Jour', values: ['2026-02-30', '2026-01-01', 'a', 'b'] },
    };
    expect(code(run(bad, month))).toBe('dataset.bad-date');
  });

  it('rend un quantile et refuse sans lever', () => {
    expect(api.quantile([1, 2, 3, 4], 0.5)).toEqual({ ok: true, value: 2.5 });
    const refused = api.quantile([], 0.5);
    expect(!refused.ok && refused.error.code).toBe('stats.empty');
  });

  it('sous-échantillonne et refuse une cible invalide, même sur une série vide', () => {
    const xs = [0, 1, 2, 3, 4];
    expect(api.lttb(xs, [1, 5, 2, 8, 3], 3).ok).toBe(true);
    const code = (r: ReturnType<typeof api.lttb>) => (r.ok ? 'ok' : r.error.code);
    expect(code(api.lttb(xs, [1, 5, 2, 8, 3], 2.5))).toBe('downsample.bad-target');
    expect(code(api.lttb([], [], -1))).toBe('downsample.bad-target');
    expect(code(api.lttb(xs, [1, 2], 3))).toBe('geometry.bad-input');
  });
});
