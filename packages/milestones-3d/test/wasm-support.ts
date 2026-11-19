// Aides des tests contre le `.wasm` construit. Le job CI `wasm` pose PP_MILESTONES_WASM=required :
// un `.wasm` absent y fait échouer les tests au lieu de les sauter.
import { existsSync } from 'node:fs';
import { describe } from 'vitest';
import { parseFault } from '../src/error.ts';
import { loadScene } from '../src/runtime.ts';
import type { Theme } from '../src/types.ts';

const WASM = new URL('../wasm/pp_milestones_wasm_bg.wasm', import.meta.url);
const GLUE = new URL('../wasm/pp_milestones_wasm.js', import.meta.url);
const required = process.env['PP_MILESTONES_WASM'] === 'required';
export const whenBuilt = required || existsSync(WASM) ? describe : describe.skip;

export const theme: Theme = {
  colors: {
    bg: { space: 'oklch', l: 0.985, c: 0.004, h: 270.7 },
    fg: { space: 'oklch', l: 0.215, c: 0.016, h: 270.7 },
    accent: { space: 'oklch', l: 0.47, c: 0.19, h: 270.7 },
    onAccent: { space: 'srgb', r: 1, g: 1, b: 1 },
    line: { space: 'oklch', l: 0.885, c: 0.01, h: 270.7 },
    muted: { space: 'oklch', l: 0.43, c: 0.022, h: 270.7 },
  },
  durationBase: 160,
  durationFast: 100,
  easing: [0.2, 0, 0, 1],
};

export interface Glue {
  checkInput(
    ids: string[],
    statuses: string[],
    emblems: string[],
    goal: boolean,
    theme: Float32Array,
  ): void;
}
const isGlue = (value: unknown): value is Glue =>
  typeof value === 'object' && value !== null && 'checkInput' in value;

export async function glue(): Promise<Glue> {
  await loadScene();
  const module: unknown = await import(/* @vite-ignore */ GLUE.href);
  if (!isGlue(module)) throw new Error('glue inattendue');
  return module;
}

export const many = (n: number, value: (i: number) => string): string[] =>
  Array.from({ length: n }, (_, i) => value(i));
export const ids = (n: number): string[] => many(n, (i) => `m${i}`);

export function codeOf(run: () => void): string {
  try {
    run();
  } catch (raised) {
    const error = parseFault(raised);
    return error.code === 'internal' ? `INTERNE ${String(raised)}` : error.code;
  }
  return 'accepté';
}
