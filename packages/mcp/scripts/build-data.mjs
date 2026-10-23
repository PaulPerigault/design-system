// Données embarquées du serveur MCP : lit la documentation produite, le registre, les jetons et
// les décisions du dépôt ; écrit `data/*.json` (clés triées, deux espaces, une fin de ligne,
// puis forme Prettier du dépôt, que `prettier --check` exige). `--check` compare sans écrire.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';
import { pageMeta, parseAdr, parseComponent, parseDecisionLog } from './parse-component.mjs';

export const SOURCES = Object.freeze({
  dist: 'apps/docs/dist',
  registry: 'packages/astro/registry/registry.json',
  tokens: 'packages/tokens/generated/tokens.json',
  roles: 'packages/tokens/src/roles.json',
  adr: 'docs/adr',
  decisions: 'docs/decisions-log.md',
});
export const OUT = 'packages/mcp/data';
const COMPONENT_PAGE = /^components\/([a-z0-9-]+)\.md$/;
const GROUP = /\/src\/([^/]+)\//;

/** Clés d'objet triées récursivement : sortie stable d'une exécution à l'autre. */
export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const keys = Object.keys(value).sort((a, b) => (a < b ? -1 : Number(a > b)));
  return Object.fromEntries(keys.map((key) => [key, sortKeys(value[key])]));
}

export const serialize = (value) => `${JSON.stringify(sortKeys(value), null, 2)}\n`;
const byKey = (key) => (a, b) => a[key].localeCompare(b[key], 'en');
const readJson = (io, path) => JSON.parse(io.read(path));

// Groupe : dossier du composant sous `src/` (layout, forms…) ; jetons : registre en repli.
const groupOf = (item) => GROUP.exec(item?.files?.[0]?.path ?? '')?.[1] ?? 'autre';
const tokensOf = (parsed, item) => (parsed.tokens.length > 0 ? parsed.tokens : item?.meta?.tokens);

function components(io, pages) {
  const { items } = readJson(io, SOURCES.registry);
  return pages.flatMap((path) => {
    const slug = COMPONENT_PAGE.exec(path)?.[1];
    if (!slug) return [];
    const item = items.find((entry) => entry.name === slug);
    const parsed = parseComponent(slug, io.read(`${SOURCES.dist}/${path}`));
    return [{ ...parsed, group: groupOf(item), tokens: tokensOf(parsed, item) ?? [] }];
  });
}

const toVar = (role) => `--pp-${role.replaceAll('.', '-')}`;
const toPair = (pair) => ({ ...pair, fg: toVar(pair.fg), bg: toVar(pair.bg) });

function tokens(io) {
  const { themes, base } = readJson(io, SOURCES.tokens);
  const pairs = readJson(io, SOURCES.roles).pairs.map(toPair);
  return { themes: { light: themes.light, dark: themes.dark }, base, pairs };
}

function decisions(io) {
  const names = io.list(SOURCES.adr).filter((name) => name.endsWith('.md'));
  const adrs = names.map((name) => parseAdr(name, io.read(`${SOURCES.adr}/${name}`)));
  const log = parseDecisionLog(io.read(SOURCES.decisions));
  return { adrs: adrs.filter(Boolean).sort(byKey('id')), decisions: log.sort(byKey('id')) };
}

/** Pur : `io.list` et `io.read` relatifs à la racine ; renvoie nom de fichier → JSON. */
export function buildData(io) {
  const pages = io.list(SOURCES.dist).filter((path) => path.endsWith('.md'));
  if (pages.length === 0) throw new Error('aucune page : lancer le build de apps/docs');
  pages.sort();
  const docs = pages.map((path) => ({ path, ...pageMeta(io.read(`${SOURCES.dist}/${path}`)) }));
  return {
    'components.json': serialize(components(io, pages).sort(byKey('slug'))),
    'tokens.json': serialize(tokens(io)),
    'adr.json': serialize(decisions(io)),
    'docs.json': serialize(docs),
  };
}

const readOrNull = (io, path) => (io.exists(path) ? io.read(path) : null);

/** Écrit `data/`, ou le compare (`--check`, code 1 si périmé) ; `io.format` : forme Prettier. */
export async function run(argv, io) {
  const built = Object.entries(buildData(io));
  const files = await Promise.all(built.map(async ([n, text]) => [n, await io.format(n, text)]));
  const stale = files.filter(([name, text]) => readOrNull(io, `${OUT}/${name}`) !== text);
  if (argv.includes('--check')) {
    const names = stale.map(([name]) => name).join(', ');
    io.err(stale.length === 0 ? 'build-data : à jour\n' : `build-data : à régénérer : ${names}\n`);
    return stale.length === 0 ? 0 : 1;
  }
  for (const [name, text] of files) io.write(`${OUT}/${name}`, text);
  io.err(`build-data : ${files.length} fichiers écrits dans ${OUT}\n`);
  return 0;
}

export function nodeIo(root) {
  const at = (path) => join(root, path);
  const write = (path, text) => {
    mkdirSync(dirname(at(path)), { recursive: true });
    writeFileSync(at(path), text);
  };
  const prettier = async (name, text) => {
    const filepath = at(`${OUT}/${name}`);
    return format(text, { ...(await resolveConfig(filepath)), filepath });
  };
  const list = (dir) =>
    readdirSync(at(dir), { recursive: true }).map((p) => p.split(sep).join('/'));
  const read = (path) => readFileSync(at(path), 'utf8');
  const err = (text) => process.stderr.write(text);
  return { list, read, exists: (path) => existsSync(at(path)), write, format: prettier, err };
}

if (import.meta.main) {
  const io = nodeIo(join(import.meta.dirname, '..', '..', '..'));
  process.exitCode = await run(process.argv.slice(2), io).catch((error) => {
    io.err(`build-data : ${error.message}\n`);
    return 1;
  });
}
