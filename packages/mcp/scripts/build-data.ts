// Données embarquées du serveur MCP : lit la documentation produite, le registre, les jetons et
// les décisions du dépôt ; écrit `data/*.json` (clés triées, deux espaces, une fin de ligne,
// puis forme Prettier du dépôt, que `prettier --check` exige). `--check` compare sans écrire.
import { join } from 'node:path';
import process from 'node:process';
import type { z } from 'zod';
import type { Component, Data } from '../src/domain/types.ts';
import { nodeIo } from './node-io.ts';
import type { BuildIo } from './node-io.ts';
import { pageMeta, parseAdr, parseComponent, parseDecisionLog } from './parse-component.ts';
import type { ParsedComponent } from './parse-component.ts';
import { generatedTokensSchema, groupOf, registrySchema, rolesSchema } from './sources.ts';
import type { RegistryItem } from './sources.ts';

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
const JSON_INDENT = 2;

const compare = (a: string, b: string): number => (a < b ? -1 : Number(a > b));

/** Clés d'objet triées récursivement : sortie stable d'une exécution à l'autre. */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value).sort(([a], [b]) => compare(a, b));
  return Object.fromEntries(entries.map(([key, item]) => [key, sortKeys(item)]));
}

export const serialize = (value: unknown): string =>
  `${JSON.stringify(sortKeys(value), null, JSON_INDENT)}\n`;
const byKey =
  <K extends string>(key: K) =>
  (a: Record<K, string>, b: Record<K, string>): number =>
    a[key].localeCompare(b[key], 'en');
const readJson = <S extends z.ZodType>(io: BuildIo, path: string, schema: S): z.output<S> =>
  schema.parse(JSON.parse(io.read(path)));

// Jetons : registre en repli.
const tokensOf = (parsed: ParsedComponent, item?: RegistryItem): string[] =>
  parsed.tokens.length > 0 ? parsed.tokens : (item?.meta?.tokens ?? []);

function components(io: BuildIo, pages: string[]): Component[] {
  const { items } = readJson(io, SOURCES.registry, registrySchema);
  return pages.flatMap((path) => {
    const slug = COMPONENT_PAGE.exec(path)?.[1];
    if (!slug) return [];
    const item = items.find((entry) => entry.name === slug);
    const parsed = parseComponent(slug, io.read(`${SOURCES.dist}/${path}`));
    return [{ ...parsed, group: groupOf(item), tokens: tokensOf(parsed, item) }];
  });
}

const toVar = (role: string): string => `--pp-${role.replaceAll('.', '-')}`;

function tokens(io: BuildIo): Data['tokens'] {
  const { themes, base } = readJson(io, SOURCES.tokens, generatedTokensSchema);
  const { pairs } = readJson(io, SOURCES.roles, rolesSchema);
  const mapped = pairs.map((pair) => ({ ...pair, fg: toVar(pair.fg), bg: toVar(pair.bg) }));
  return { themes: { light: themes.light, dark: themes.dark }, base, pairs: mapped };
}

function decisions(io: BuildIo) {
  const names = io.list(SOURCES.adr).filter((name) => name.endsWith('.md'));
  const adrs = names.flatMap((name) => parseAdr(name, io.read(`${SOURCES.adr}/${name}`)) ?? []);
  const log = parseDecisionLog(io.read(SOURCES.decisions));
  return { adrs: adrs.sort(byKey('id')), decisions: log.sort(byKey('id')) };
}

/** Pur : `io.list` et `io.read` relatifs à la racine ; renvoie nom de fichier → JSON. */
export function buildData(io: BuildIo): Record<string, string> {
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

const readOrNull = (io: BuildIo, path: string): string | null =>
  io.exists(path) ? io.read(path) : null;

/** Écrit `data/`, ou le compare (`--check`, code 1 si périmé) ; `io.format` : forme Prettier. */
export async function run(argv: string[], io: BuildIo): Promise<number> {
  const built = Object.entries(buildData(io));
  const files = await Promise.all(
    built.map(async ([name, text]): Promise<[string, string]> => [
      name,
      await io.format(name, text),
    ]),
  );
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

if (import.meta.main) {
  const io = nodeIo(join(import.meta.dirname, '..', '..', '..'), OUT);
  process.exitCode = await run(process.argv.slice(2), io).catch((error: unknown) => {
    io.err(`build-data : ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  });
}
