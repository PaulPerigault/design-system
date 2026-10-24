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

export function tokenNames(json: { themes?: Record<string, Record<string, unknown>>; base?: Record<string, unknown> }): Set<string> {
  const groups: Record<string, unknown>[] = [...Object.values(json.themes ?? {}), json.base ?? {}] as Record<string, unknown>[];
  return new Set(groups.flatMap((group) => Object.keys(group)).filter((key): key is string => typeof key === 'string'));
}

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

/** Propriétés `--pp-*` déclarées localement (variables internes d'un composant). */
const localDeclarations = (texts: { file: string; text: string }[]): Set<string> =>
  new Set(texts.flatMap(({ text }) => [...text.matchAll(DECLARATION)].map((m) => m[1] as string)));

export function unknownReferences(
  texts: { file: string; text: string }[],
  names: Iterable<string>,
): { file: string; line: number; name: string }[] {
  const known = new Set([...names, ...localDeclarations(texts)]);
  return texts.flatMap(({ file, text }) =>
    [...text.matchAll(REFERENCE)]
      .filter((match) => match[1] !== undefined && !known.has(match[1]))
      .map((match) => ({ file, line: lineOf(text, match.index), name: match[1] as string })),
  );
}

export function unusedTokens(texts: { file: string; text: string }[], names: Iterable<string>): string[] {
  const used = new Set(texts.flatMap(({ text }) => [...text.matchAll(REFERENCE)].map((m) => m[1] as string)));
  return [...names].filter((name) => !used.has(name)).sort();
}

interface FsLike {
  readdirSync: (dir: string, options?: { withFileTypes?: true }) => import('node:fs').Dirent[];
}

/** Fichiers sources d'un dossier, hors dossiers ignorés. */
export function listSources(dir: string, fs: FsLike = { readdirSync: (): import('node:fs').Dirent[] => [] }): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED.has(entry.name) ? [] : listSources(path, fs);
    return EXTENSIONS.includes(extname(entry.name)) ? [path] : [];
  });
}

export function parseArgs(argv: string[]): { tokens: string; dirs: string[] } {
  const index = argv.indexOf('--tokens');
  const tokens = index === -1 ? undefined : argv[index + 1];
  const dirs = argv.filter((_, i) => i !== index && i !== index + 1);
  if (!tokens || dirs.length === 0) {
    throw new Error('usage : check-tokens --tokens <tokens.json> <dossiers…>');
  }
  return { tokens, dirs };
}

interface TokensIo {
  readFile: (path: string) => string;
  readdirSync: (dir: string, options?: { withFileTypes?: true }) => import('node:fs').Dirent[];
  out: (message: string) => void;
  err: (message: string) => void;
}

export function run(argv: string[], io: TokensIo): number {
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
  const write = (stream: NodeJS.WriteStream): ((message: string) => void) => (message) => stream.write(`${message}\n`);
  const readFile = (file: string): string => readFileSync(file, 'utf8');
  const io: TokensIo = { 
    readFile, 
    readdirSync: (dir: string, options?: { withFileTypes?: true }) => readdirSync(dir, options as import('node:fs').ObjectEncodingOptions & { withFileTypes?: true }) as import('node:fs').Dirent[], 
    out: write(process.stdout), 
    err: write(process.stderr) 
  };
  try {
    process.exitCode = run(process.argv.slice(ARGV_START), io);
  } catch (error: unknown) {
    if (error instanceof Error) io.err(error.message);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  const write = (stream: NodeJS.WriteStream): ((message: string) => void) => (message) => stream.write(`${message}\n`);
  const readFile = (file: string): string => readFileSync(file, 'utf8');
  const io = { readFile, readdirSync, out: write(process.stdout), err: write(process.stderr) };
  try {
    process.exitCode = run(process.argv.slice(ARGV_START), io);
  } catch (error: unknown) {
    if (error instanceof Error) io.err(error.message);
    process.exitCode = 1;
  }
}
