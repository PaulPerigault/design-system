// Assemble le registre : recalcule `meta.tokens` de chaque fragment, vérifie fichiers et
// couverture des exports, écrit `registry.json`. `--check` : échoue sur tout écart, n'écrit rien.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { knownTokens, registryIndex, uncovered, withTokens } from './registry.mjs';

const PACKAGE = 'packages/astro/';
const ITEMS = `${PACKAGE}registry/items`;
const INDEX = `${PACKAGE}registry/registry.json`;
const TOKENS = 'packages/tokens/generated/tokens.json';

/** JSON formaté par Prettier, avec la configuration du dépôt : `format:check` reste vert. */
async function serialize(value, path) {
  const options = (await resolveConfig(path)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...options, filepath: path });
}

export async function run(root = process.cwd(), { check = false } = {}) {
  const at = (path) => join(root, path);
  const read = (path) => (existsSync(at(path)) ? readFileSync(at(path), 'utf8') : undefined);
  const known = knownTokens(JSON.parse(read(TOKENS)));
  const manifest = JSON.parse(read(`${PACKAGE}package.json`));
  const names = readdirSync(at(ITEMS))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const outputs = new Map();
  const items = names.map((name) =>
    withTokens(JSON.parse(read(`${ITEMS}/${name}`)), { read, known }),
  );
  for (const [index, item] of items.entries()) {
    outputs.set(`${ITEMS}/${names[index]}`, await serialize(item, at(`${ITEMS}/${names[index]}`)));
  }
  const identity = { name: manifest.name, homepage: manifest.homepage };
  outputs.set(INDEX, await serialize(registryIndex(items, identity), at(INDEX)));
  const problems = uncovered(manifest.exports, items, PACKAGE).map(
    (key) => `export sans élément de registre : ${key}`,
  );
  const stale = [...outputs].filter(([path, text]) => read(path) !== text).map(([path]) => path);
  if (check) problems.push(...stale.map((path) => `à régénérer (npm run registry) : ${path}`));
  else for (const path of stale) writeFileSync(at(path), outputs.get(path));
  return { problems, written: check ? [] : stale };
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  const { problems, written } = await run(process.cwd(), { check });
  for (const path of written) console.log(`registre : écrit ${path}`);
  for (const problem of problems) console.error(`registre : ${problem}`);
  if (problems.length > 0) process.exit(1);
  console.log('registre : OK');
}
