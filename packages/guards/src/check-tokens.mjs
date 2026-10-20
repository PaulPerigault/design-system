// Garde-fou : chaque `var(--pp-…)` pointe vers un token défini ; les tokens jamais utilisés
// sont signalés. Aucune dépendance d'exécution : la liste des noms vient de `tokens.json`.
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import process from 'node:process';

const ARGV_START = 2;
const EXTENSIONS = ['.astro', '.css', '.ts', '.mjs'];
const SKIPPED = new Set(['node_modules', 'dist', 'generated']);
const REFERENCE = /var\(\s*(--pp-[\w-]+)/g;
const DECLARATION = /(--pp-[\w-]+)\s*:/g;

/**
 * Noms de tokens d'un `tokens.json` généré (`themes.*` et `base`).
 * @param {object} json contenu de tokens.json
 * @returns {Set<string>}
 */
export function tokenNames(json) {
  const groups = [...Object.values(json.themes ?? {}), json.base ?? {}];
  return new Set(groups.flatMap((group) => Object.keys(group)));
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Propriétés `--pp-*` déclarées localement (variables internes d'un composant). */
const localDeclarations = (texts) =>
  new Set(texts.flatMap(({ text }) => [...text.matchAll(DECLARATION)].map((m) => m[1])));

/**
 * Références `var(--pp-…)` vers un nom ni dans `names` ni déclaré dans les sources.
 * @param {{ file: string, text: string }[]} texts fichiers lus
 * @param {Iterable<string>} names noms de tokens définis
 * @returns {{ file: string, line: number, name: string }[]}
 */
export function unknownReferences(texts, names) {
  const known = new Set([...names, ...localDeclarations(texts)]);
  return texts.flatMap(({ file, text }) =>
    [...text.matchAll(REFERENCE)]
      .filter((match) => !known.has(match[1]))
      .map((match) => ({ file, line: lineOf(text, match.index), name: match[1] })),
  );
}

/**
 * Tokens définis dans `names` mais jamais référencés par `var(...)`.
 * @param {{ file: string, text: string }[]} texts fichiers lus
 * @param {Iterable<string>} names noms de tokens définis
 * @returns {string[]}
 */
export function unusedTokens(texts, names) {
  const used = new Set(texts.flatMap(({ text }) => [...text.matchAll(REFERENCE)].map((m) => m[1])));
  return [...names].filter((name) => !used.has(name)).sort();
}

/** Fichiers sources d'un dossier, hors dossiers ignorés. */
export function listSources(dir, fs = { readdirSync }) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED.has(entry.name) ? [] : listSources(path, fs);
    return EXTENSIONS.includes(extname(entry.name)) ? [path] : [];
  });
}

/**
 * @param {string[]} argv arguments après `node script`
 * @returns {{ tokens: string, dirs: string[] }}
 */
export function parseArgs(argv) {
  const index = argv.indexOf('--tokens');
  const tokens = index === -1 ? undefined : argv[index + 1];
  const dirs = argv.filter((_, i) => i !== index && i !== index + 1);
  if (!tokens || dirs.length === 0) {
    throw new Error('usage : check-tokens --tokens <tokens.json> <dossiers…>');
  }
  return { tokens, dirs };
}

/**
 * @param {string[]} argv arguments
 * @param {{ readFile: Function, readdirSync: Function, out: Function, err: Function }} io
 * @returns {number} code de sortie
 */
export function run(argv, io) {
  const { tokens, dirs } = parseArgs(argv);
  const names = tokenNames(JSON.parse(io.readFile(tokens)));
  const files = dirs.flatMap((dir) => listSources(dir, io));
  const texts = files.map((file) => ({ file, text: io.readFile(file) }));
  const unknown = unknownReferences(texts, names);
  for (const { file, line, name } of unknown) io.err(`${file}:${line}: token inconnu ${name}`);
  for (const name of unusedTokens(texts, names)) io.out(`avertissement : ${name} jamais utilisé`);
  return unknown.length > 0 ? 1 : 0;
}

if (import.meta.main) {
  const write = (stream) => (message) => stream.write(`${message}\n`);
  const readFile = (file) => readFileSync(file, 'utf8');
  const io = { readFile, readdirSync, out: write(process.stdout), err: write(process.stderr) };
  try {
    process.exitCode = run(process.argv.slice(ARGV_START), io);
  } catch (error) {
    io.err(error.message);
    process.exitCode = 1;
  }
}
