import { existsSync, readFileSync } from 'node:fs';
import { describe } from 'vitest';
import type * as Index from '../src/index.ts';

const DIST = new URL('../dist/index.js', import.meta.url);
const WASM = new URL('../wasm/pp_color_wasm_bg.wasm', import.meta.url);
const VECTORS = new URL('../../../crates/pp-color/tests/vectors/parity.json', import.meta.url);

export type Api = typeof Index;

/** Le job CI `wasm` pose PP_COLOR_WASM=required : un `.wasm` absent y fait échouer, pas sauter. */
const required = process.env.PP_COLOR_WASM === 'required';
const built = existsSync(WASM) && existsSync(DIST);

/** Suites qui exigent le paquet construit (`npm run build` et `npm run build:wasm`). */
export const whenBuilt = required || built ? describe : describe.skip;

/** Le paquet tel que publié : `dist/`, jamais `src/`, puis `init()` du `.wasm`. */
export async function loadBuilt(): Promise<Api> {
  const api: Api = await import(DIST.href);
  await api.init();
  return api;
}

export interface Vectors {
  colors: {
    name: string;
    oklch: [number, number, number];
    srgb: number[];
    linear: number[];
    inGamut: boolean;
    fit: { l: number; c: number; h: number };
    hex: string | null;
  }[];
  hexes: { hex: string; oklch: { l: number; c: number; h: number } }[];
  contrasts: {
    name: string;
    fg: { hex?: string; oklch?: [number, number, number] };
    bg: { hex?: string; oklch?: [number, number, number] };
    ratio?: number;
    centi?: number;
    lc?: number;
    error?: string;
  }[];
}

export const vectors = (): Vectors => JSON.parse(readFileSync(VECTORS, 'utf8'));
