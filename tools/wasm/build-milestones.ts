// Compile pp-milestones-wasm en `.wasm` : cargo (wasm32), wasm-bindgen (`--target web`), puis
// `wasm-opt -Oz` (binaryen), empreinte SHA-256 et poids avant et après. Rien n'est commité : le
// dossier de sortie est ignoré. Usage : `node tools/wasm/build-milestones.ts [--out <dossier>]`.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { optimize } from './wasm-opt.ts';
import { weightReport } from './report.ts';
import { digestLine, weigh } from './wasm-files.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CRATE = 'pp-milestones-wasm';
const NAME = 'pp_milestones_wasm';
const RELEASE = `target/wasm32-unknown-unknown/release/${NAME}.wasm`;
export const WASM_FILE = `${NAME}_bg.wasm`;
export const GLUE_FILE = `${NAME}.js`;

function step(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  const { status } = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (status !== 0) throw new Error(`${command} a échoué (code ${status})`);
}

const { values } = parseArgs({ options: { out: { type: 'string' } } });
const out = resolve(ROOT, values.out ?? 'packages/milestones-3d/wasm');
const target = ['--target', 'wasm32-unknown-unknown', '--release', '--locked'];
step('cargo', ['build', '-p', CRATE, ...target]);
mkdirSync(out, { recursive: true });
step('wasm-bindgen', ['--target', 'web', '--out-dir', out, '--out-name', NAME, RELEASE]);

const file = join(out, WASM_FILE);
const before = weigh(readFileSync(file));
optimize(file);
const bytes = readFileSync(file);
writeFileSync(`${file}.sha256`, digestLine(bytes, WASM_FILE));
const glue = weigh(readFileSync(join(out, GLUE_FILE)));
const report = weightReport({ before, after: weigh(bytes), glue, optimized: true }).join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
