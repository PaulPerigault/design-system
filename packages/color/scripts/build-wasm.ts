// Compile pp-color en `.wasm` (CI et poste de travail) : cargo (wasm32), puis wasm-bindgen
// (`--target web`), puis empreinte SHA-256 et poids. Rien n'est commité : `wasm/` est ignoré.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIGEST_FILE, WASM_DIR, WASM_FILE, digestLine, weigh, weightLine } from './wasm-files.ts';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PACKAGE = fileURLToPath(new URL('../', import.meta.url));
const RELEASE = 'target/wasm32-unknown-unknown/release/pp_color_wasm.wasm';

function step(command: string, args: string[]): void {
  console.log(`$ ${command} ${args.join(' ')}`);
  const { status } = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (status !== 0) throw new Error(`${command} a échoué (code ${status})`);
}

const out = join(PACKAGE, WASM_DIR);
step(
  'cargo',
  ['build', '-p', 'pp-color-wasm', '--target', 'wasm32-unknown-unknown'].concat([
    '--release',
    '--locked',
  ]),
);
mkdirSync(out, { recursive: true });
step('wasm-bindgen', ['--target', 'web', '--out-dir', out, '--out-name', 'pp_color_wasm', RELEASE]);

const bytes = readFileSync(join(out, WASM_FILE));
writeFileSync(join(out, DIGEST_FILE), digestLine(bytes));
const line = weightLine(weigh(bytes));
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
