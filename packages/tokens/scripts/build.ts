/**
 * Générateur DTCG → `generated/tokens.css`, `tokens.json`, `tokens.d.ts` (fichiers versionnés).
 * `node scripts/build.ts` écrit ; `--check` régénère en mémoire et sort en 1 si un fichier diffère.
 * `--accent-hue`, `--font-stack` et `--out-dir` produisent une variante hors de `generated/`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCli } from './lib/cli.ts';
import { run } from './lib/run.ts';

export { buildModel, generate, generateWith } from './lib/generate.ts';
export { findDrift, run } from './lib/run.ts';
export type { RunIo, RunResult } from './lib/run.ts';

const SOURCE_DIR = new URL('../src/tokens/', import.meta.url);
const TARGET_DIR = new URL('../generated/', import.meta.url);

function readOptional(url: URL): string | undefined {
  try {
    return readFileSync(url, 'utf8');
  } catch {
    return undefined;
  }
}

function writeOutput(dir: URL): (name: string, text: string) => void {
  return (name, text) => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL(name, dir), text);
  };
}

if (import.meta.main) {
  const cli = parseCli(process.argv.slice(2));
  if (!cli.ok) {
    console.error(`tokens : ${cli.error.code} : ${cli.error.message}`);
    process.exit(2);
  }
  const { check, input, outDir } = cli.value;
  const target = outDir === undefined ? TARGET_DIR : pathToFileURL(`${resolve(outDir)}/`);
  const { code, files, error } = run({
    check,
    input,
    readText: (name) => readFileSync(new URL(name, SOURCE_DIR), 'utf8'),
    readTarget: (name) => readOptional(new URL(name, target)),
    writeTarget: writeOutput(target),
  });
  if (error !== undefined) {
    console.error(`tokens : ${error.code} : ${error.message}`);
  } else if (code === 0) {
    console.log(check ? 'tokens : generated/ à jour' : `tokens : généré (${files.join(', ')})`);
  } else {
    console.error('tokens : fichiers générés périmés, lancer `npm run build` :');
    for (const file of files) console.error(`  generated/${file}`);
  }
  process.exitCode = code;
}
