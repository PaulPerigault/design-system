/**
 * Générateur DTCG → `generated/tokens.css`, `tokens.json`, `tokens.d.ts` (fichiers versionnés).
 * `node scripts/build.mjs` écrit ; `--check` régénère en mémoire et sort en 1 si un fichier diffère.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { emitCss } from './lib/emit-css.mjs';
import { emitDts } from './lib/emit-dts.mjs';
import { emitJson } from './lib/emit-json.mjs';
import { entries } from './lib/flatten.mjs';
import { colorEntry, cssValue } from './lib/css-value.mjs';
import { readSource } from './lib/read-source.mjs';

const SOURCE_DIR = new URL('../src/tokens/', import.meta.url);
const TARGET_DIR = new URL('../generated/', import.meta.url);

/** Arbres DTCG → modèle : tokens de base en CSS, couleurs de thème en OKLCH et hexadécimal. */
export function buildModel({ base, themes }) {
  return {
    base: entries(base).map((token) => ({ ...token, css: cssValue(token) })),
    themes: Object.fromEntries(
      Object.entries(themes).map(([theme, tree]) => [theme, entries(tree).map(colorEntry)]),
    ),
  };
}

/** @returns {Record<string, string>} contenu de chaque fichier généré, par nom */
export function generate(readText) {
  const model = buildModel(readSource(readText));
  return {
    'tokens.css': emitCss(model),
    'tokens.json': emitJson(model),
    'tokens.d.ts': emitDts(model),
  };
}

/** @returns {string[]} fichiers absents ou différents de la génération */
export function findDrift(outputs, readTarget) {
  return Object.keys(outputs).filter((name) => readTarget(name) !== outputs[name]);
}

/**
 * Entrées-sorties injectées : `readText` (source), `readTarget` (généré, `undefined` si absent),
 * `writeTarget` (écriture, hors `--check`).
 * @returns {{ code: 0 | 1, files: string[] }}
 */
export function run({ check, readText, readTarget, writeTarget }) {
  const outputs = generate(readText);
  if (check) {
    const files = findDrift(outputs, readTarget);
    return { code: files.length > 0 ? 1 : 0, files };
  }
  for (const [name, text] of Object.entries(outputs)) writeTarget(name, text);
  return { code: 0, files: Object.keys(outputs) };
}

function readOptional(url) {
  try {
    return readFileSync(url, 'utf8');
  } catch {
    return undefined;
  }
}

function writeOutput(name, text) {
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
