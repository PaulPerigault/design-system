// Temps de chargement mesuré, affiché, jamais bloquant : import + premier appel, référence
// TypeScript contre paquet WebAssembly, médiane de processus Node neufs (démarrage de Node exclu).
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const RUNS = 15;
const MS_PER_NS = 1e6;
const KIB = 1024;
const HEX = '#336699';
const href = (path: string): string => new URL(path, import.meta.url).href;

const reference = `const { hexToOklch } = await import(${JSON.stringify(href('../../tokens/dist/lib/color.js'))}); hexToOklch(${JSON.stringify(HEX)});`;
const wasm = `const api = await import(${JSON.stringify(href('../dist/index.js'))}); await api.init(); api.hexToOklch(${JSON.stringify(HEX)});`;

function once(body: string): number {
  const code = `const t = process.hrtime.bigint(); ${body} console.log(Number(process.hrtime.bigint() - t));`;
  const { stdout, status } = spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
  });
  if (status !== 0) throw new Error('mesure : le processus a échoué');
  return Number(stdout.trim()) / MS_PER_NS;
}

const median = (values: number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? Number.NaN;
const measure = (body: string): number => median(Array.from({ length: RUNS }, () => once(body)));

const bytes = readFileSync(new URL('../wasm/pp_color_wasm_bg.wasm', import.meta.url));
const kib = (n: number): string => (n / KIB).toFixed(1);

const lines = [
  `poids du .wasm : ${kib(bytes.length)} Kio, ${kib(gzipSync(bytes).length)} Kio en gzip`,
  `chargement + premier appel (médiane de ${RUNS} processus Node ${process.version}) :`,
  `- référence TypeScript : ${measure(reference).toFixed(1)} ms`,
  `- paquet WebAssembly : ${measure(wasm).toFixed(1)} ms`,
];
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
