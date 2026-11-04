// Mesure et réécrit apps/docs/src/data/proofs.json : `npm run proofs` (build de la doc requis avant).
// Mesuré : tests unitaires (Vitest), tests e2e déclarés (--list, non exécutés), pages, composants,
// registre, glossaire, paires de contraste, attestations npm. Les autres champs restent inchangés.
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import * as core from './proofs-core.mjs';

const PROOFS = 'apps/docs/src/data/proofs.json';
const DIST = 'apps/docs/dist';
const SEP = process.platform === 'win32' ? '\\' : '/';
const MAX_BUFFER = 256 * 1024 * 1024;
const node = (args) =>
  execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: MAX_BUFFER });
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** @returns {object} mesures brutes ; `io` permet de remplacer les commandes et les lectures. */
export function measure(io) {
  const files = io.list(DIST).map((p) => p.replaceAll(SEP, '/'));
  return {
    unit: core.unitTests(io.vitest()),
    e2eDeclared: core.e2eDeclared(io.playwrightList()),
    pages: core.pageCount(files),
    components: core.componentCount(files),
    registryItems: io.json('packages/astro/registry/registry.json').items.length,
    glossaryTerms: core.glossaryTerms(io.text(join(DIST, 'glossaire/index.html'))),
    contrast: core.contrast(io.json('packages/tokens/src/roles.json').pairs),
    attestations: core.attestations(io.auditSignatures()),
  };
}

const realIo = {
  list: (dir) => readdirSync(dir, { recursive: true }),
  text: (path) => readFileSync(path, 'utf8'),
  json,
  vitest: () => node(['node_modules/vitest/vitest.mjs', 'run', '--reporter=json']),
  playwrightList: () =>
    node([
      'node_modules/@playwright/test/cli.js',
      'test',
      '-c',
      'apps/docs/playwright.config.ts',
      '--list',
    ]),
  auditSignatures: () => execSync('npm audit signatures', { encoding: 'utf8' }),
};

if (import.meta.main) {
  const date = new Date().toISOString().slice(0, 10);
  const next = core.merge(json(PROOFS), measure(realIo), date);
  writeFileSync(PROOFS, `${JSON.stringify(next, null, 2)}\n`);
  process.stdout.write(`proofs.json mesuré le ${date}\n`);
}
