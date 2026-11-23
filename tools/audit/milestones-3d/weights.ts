// Poids des octets de la scène, compressés en brotli comme l'hébergeur les sert : `.wasm`, glue
// wasm-bindgen, enveloppe du paquet 3D, comportement du composant et textures de démonstration.
// Mesures seulement (D-106) : le budget de l'ADR-0013 (45 Ko de `.wasm`) est rappelé, pas imposé.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync } from 'node:zlib';
import { at, info } from './model.ts';
import type { Row } from './model.ts';

const WASM_BUDGET_BYTES = 45 * 1024;

const brotli = (file: string): number => brotliCompressSync(readFileSync(file)).length;
const kib = (bytes: number): string => `${(bytes / 1024).toFixed(1)} Kio`;

function files(dir: string, test: (name: string) => boolean): string[] {
  try {
    return readdirSync(dir)
      .filter(test)
      .map((name) => join(dir, name));
  } catch {
    return [];
  }
}

function total(paths: string[], size: (file: string) => number): number {
  return paths.reduce((sum, file) => sum + size(file), 0);
}

export function auditWeights(dist: string): Row[] {
  const where = at('-', 'poids (brotli)');
  const astro = join(dist, '_astro');
  const wasm = files(astro, (n) => n.startsWith('pp_milestones') && n.endsWith('.wasm'));
  const glue = files(astro, (n) => n.startsWith('pp_milestones') && n.endsWith('.js'));
  const wrapper = files(astro, (n) => n.startsWith('src.') && n.endsWith('.js'));
  const behavior = files(astro, (n) => n.startsWith('milestones-3d.astro') && n.endsWith('.js'));
  const textures = files(join(dist, 'milestones-3d'), (n) => n.endsWith('.webp'));
  const bytes = total(wasm, brotli);
  const budget = `budget ADR-0013 : ${kib(WASM_BUDGET_BYTES)}`;
  return [
    info(
      where,
      '.wasm',
      `${kib(bytes)} (${budget}, ${bytes <= WASM_BUDGET_BYTES ? 'tenu' : 'dépassé'})`,
    ),
    info(where, 'glue wasm-bindgen (.js)', kib(total(glue, brotli))),
    info(where, 'paquet 3D (enveloppe TypeScript)', kib(total(wrapper, brotli))),
    info(where, 'comportement du composant', kib(total(behavior, brotli))),
    info(
      where,
      'textures de démonstration (.webp, déjà compressées)',
      `${textures.length} fichiers, ${kib(total(textures, (f) => readFileSync(f).length))}`,
    ),
  ];
}
