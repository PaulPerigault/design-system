/**
 * Générateur DTCG → `generated/tokens.css`, `tokens.json`, `tokens.d.ts` (fichiers versionnés).
 * `node scripts/build.ts` écrit ; `--check` régénère en mémoire et sort en 1 si un fichier diffère.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Model, Source } from './lib/types.ts';
import { emitCss } from './lib/emit-css.ts';
import { emitDts } from './lib/emit-dts.ts';
import { emitJson } from './lib/emit-json.ts';
import { entries } from './lib/flatten.ts';
import { colorEntry, cssValue } from './lib/css-value.ts';
import { readSource } from './lib/read-source.ts';

const SOURCE_DIR = new URL('../src/tokens/', import.meta.url);
const TARGET_DIR = new URL('../generated/', import.meta.url);

/** Arbres DTCG → modèle : tokens de base en CSS, couleurs de thème en OKLCH et hexadécimal. */
export function buildModel({ base, themes }: Source): Model {
  return {
    base: entries(base).map((token) => ({ ...token, css: cssValue(token) })),
    themes: Object.fromEntries(
      Object.entries(themes).map(([theme, tree]) => [theme, entries(tree).map(colorEntry)]),
    ),
  };
}

/** Contenu de chaque fichier généré, par nom. */
export function generate(readText: (name: string) => string): Record<string, string> {
  const model = buildModel(readSource(readText));
  return {
    'tokens.css': emitCss(model),
    'tokens.json': emitJson(model),
    'tokens.d.ts': emitDts(model),
  };
}

/** Fichiers absents ou différents de la génération. */
export function findDrift(
  outputs: Record<string, string>,
  readTarget: (name: string) => string | undefined,
): string[] {
  return Object.keys(outputs).filter((name) => readTarget(name) !== outputs[name]);
}

/**
 * Entrées-sorties injectées : `readText` (source), `readTarget` (généré, `undefined` si absent),
 * `writeTarget` (écriture, hors `--check`).
 */
export interface RunIo {
  check: boolean;
  readText: (name: string) => string;
  readTarget: (name: string) => string | undefined;
  writeTarget: (name: string, text: string) => void;
}

export function run({ check, readText, readTarget, writeTarget }: RunIo): {
  code: 0 | 1;
  files: string[];
} {
  const outputs = generate(readText);
  if (check) {
    const files = findDrift(outputs, readTarget);
    return { code: files.length > 0 ? 1 : 0, files };
  }
  for (const [name, text] of Object.entries(outputs)) writeTarget(name, text);
  return { code: 0, files: Object.keys(outputs) };
}

function readOptional(url: URL): string | undefined {
  try {
    return readFileSync(url, 'utf8');
  } catch {
    return undefined;
  }
}

function writeOutput(name: string, text: string): void {
  mkdirSync(TARGET_DIR, { recursive: true });
  writeFileSync(new URL(name, TARGET_DIR), text);
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  const { code, files } = run({
    check,
    readText: (name) => readFileSync(new URL(name, SOURCE_DIR), 'utf8'),
    readTarget: (name) => readOptional(new URL(name, TARGET_DIR)),
    writeTarget: writeOutput,
  });
  if (code === 0) {
    console.log(check ? 'tokens : generated/ à jour' : `tokens : généré (${files.join(', ')})`);
  } else {
    console.error('tokens : fichiers générés périmés, lancer `npm run build` :');
    for (const file of files) console.error(`  generated/${file}`);
  }
  process.exitCode = code;
}
