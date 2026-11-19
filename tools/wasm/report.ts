// Rapport de poids du `.wasm` de la scène : avant et après `wasm-opt`, glue JavaScript, cible.
// Mesure affichée, jamais bloquante (D-106) ; la cible est celle de l'ADR-0012.
import type { Weight } from './wasm-files.ts';

/** Cible de poids du `.wasm` en brotli (ADR-0012, décision 7). Un dépassement s'écrit, ne bloque pas. */
export const BROTLI_TARGET = 60 * 1024;
const KIBIBYTE = 1024;

const kib = (size: number): string => (size / KIBIBYTE).toFixed(1);
const row = (label: string, { raw, gzip, brotli }: Weight): string =>
  `| ${label} | ${raw} | ${gzip} | ${brotli} |`;

export interface Measures {
  before: Weight;
  after: Weight;
  glue: Weight;
  optimized: boolean;
}

/** Tableau Markdown (résumé de CI et README) : octets bruts, gzip, brotli. */
export function weightReport(m: Measures): string[] {
  const verdict =
    m.after.brotli <= BROTLI_TARGET
      ? `sous la cible de ${kib(BROTLI_TARGET)} Kio en brotli`
      : `AU-DESSUS de la cible de ${kib(BROTLI_TARGET)} Kio en brotli (non bloquant)`;
  return [
    '| pp_milestones_wasm | brut (o) | gzip (o) | brotli (o) |',
    '| --- | ---: | ---: | ---: |',
    row('`.wasm` avant wasm-opt', m.before),
    row(m.optimized ? '`.wasm` après wasm-opt -Oz' : '`.wasm` (wasm-opt non lancé)', m.after),
    row('glue JavaScript', m.glue),
    '',
    `Poids livré : ${kib(m.after.brotli)} Kio en brotli, ${verdict}.`,
  ];
}
