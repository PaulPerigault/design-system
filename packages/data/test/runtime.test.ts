import { expect, it } from 'vitest';
import { aggregate } from '../src/aggregate.ts';
import { lttb, quantile } from '../src/index.ts';
import { isReady } from '../src/runtime.ts';

// Ce fichier ne charge jamais le .wasm : tant que `init()` n'a pas été attendu, tout appel rend une
// erreur typée (`data.not-ready`) au lieu de lever.
const code = (result: { ok: boolean; error?: { code: string } }): string | undefined =>
  result.error?.code;

it('refuse tout appel avant init() avec une erreur typée, sans lever', () => {
  expect(isReady()).toBe(false);
  expect(code(quantile([1, 2], 0.5))).toBe('data.not-ready');
  expect(code(lttb([0, 1], [1, 2], 2))).toBe('data.not-ready');
  const dataset = {
    schema: 1 as const,
    x: { kind: 'category' as const, label: 'x', values: ['a'] },
    series: [{ id: 's', label: 'S', unit: '', values: [1] }],
  };
  expect(code(aggregate(dataset, { by: 'category', operation: 'sum' }))).toBe('data.not-ready');
});

it('contrôle la spécification avant de demander le .wasm', () => {
  const dataset = {
    schema: 1 as const,
    x: { kind: 'category' as const, label: 'x', values: ['a'] },
    series: [{ id: 's', label: 'S', unit: '', values: [1] }],
  };
  expect(code(aggregate(dataset, { by: 'day', operation: 'sum' }))).toBe('aggregate.bad-axis');
});
