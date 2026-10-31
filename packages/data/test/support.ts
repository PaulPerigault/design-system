import { existsSync, readFileSync } from 'node:fs';
import { describe } from 'vitest';
import type * as Index from '../src/index.ts';

const DIST = new URL('../dist/index.js', import.meta.url);
const WASM = new URL('../wasm/pp_data_wasm_bg.wasm', import.meta.url);
const VECTORS = new URL('../../../crates/pp-data/tests/vectors/parity.json', import.meta.url);

export type Api = typeof Index;

/** Le job CI `wasm` pose PP_DATA_WASM=required : un `.wasm` absent y fait échouer, pas sauter. */
const required = process.env.PP_DATA_WASM === 'required';
const built = existsSync(WASM) && existsSync(DIST);

/** Suites qui exigent le paquet construit (`npm run build` et `npm run build:wasm`). */
export const whenBuilt = required || built ? describe : describe.skip;

/** Le paquet tel que publié : `dist/`, jamais `src/`, puis `init()` du `.wasm`. */
export async function loadBuilt(): Promise<Api> {
  const api: Api = await import(DIST.href);
  const ready = await api.init();
  if (!ready.ok) throw new Error(ready.error.message);
  return api;
}

export interface Vectors {
  quantiles: {
    name: string;
    values: (number | null)[];
    probabilities: (number | null)[];
    expected: number[] | null;
    error: string | null;
  }[];
  lttb: {
    name: string;
    xs: (number | null)[];
    values: (number | null)[];
    target: number;
    expected: number[] | null;
    error: string | null;
  }[];
  aggregates: {
    name: string;
    by: 'category' | 'day' | 'month' | 'year';
    operation: 'sum' | 'mean' | 'min' | 'max' | 'count' | 'first' | 'last';
    x: string[];
    series: (number | string | null)[][];
    expected: { labels: string[]; series: (number | null)[][] } | null;
    error: string | null;
  }[];
}

export const vectors = (): Vectors => JSON.parse(readFileSync(VECTORS, 'utf8'));

/** JSON écrit `null` pour NaN et Infinity (quantiles, abscisses) : relu comme `NaN`. */
export const nanIfNull = (list: readonly (number | null)[]): number[] =>
  list.map((value) => value ?? Number.NaN);
