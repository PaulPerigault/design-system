// Parties pures des scripts `.wasm` (color et data) : empreinte SHA-256 et rapport de poids.
import { createHash } from 'node:crypto';
import { brotliCompressSync, gzipSync } from 'node:zlib';

export const WASM_DIR = 'wasm';
const KIBIBYTE = 1024;

export const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

/** Format de `sha256sum` : `<empreinte>  <fichier>`, relu par `sha256sum -c`. */
export const digestLine = (bytes: Uint8Array, file: string): string =>
  `${sha256(bytes)}  ${file}\n`;

/** `null` si l'empreinte enregistrée correspond au fichier, sinon la raison du refus. */
export function digestFailure(bytes: Uint8Array, recorded: string, file: string): string | null {
  const expected = digestLine(bytes, file);
  return recorded === expected
    ? null
    : `empreinte SHA-256 : attendu « ${expected.trim()} », enregistré « ${recorded.trim()} »`;
}

export interface Weight {
  raw: number;
  gzip: number;
  brotli: number;
}

export const weigh = (bytes: Uint8Array): Weight => ({
  raw: bytes.length,
  gzip: gzipSync(bytes, { level: 9 }).length,
  brotli: brotliCompressSync(bytes).length,
});

const kib = (size: number): string => (size / KIBIBYTE).toFixed(1);

/** Poids mesuré, affiché, jamais bloquant (principe GreenOps). */
export const weightLine = ({ raw, gzip, brotli }: Weight, file: string): string =>
  `${file} : ${raw} o (${kib(raw)} Kio), gzip ${gzip} o, brotli ${brotli} o`;
