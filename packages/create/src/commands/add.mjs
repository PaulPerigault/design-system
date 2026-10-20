import { posix } from 'node:path';
import { applyPlan } from '../lib/plan.mjs';
import { PACKAGE_NAME } from '../lib/registry.mjs';
import { exportsCover } from './exports.mjs';
import { dependencyPlan, MANIFEST, readManifest } from './manifest.mjs';
import * as shared from './snippet.mjs';

/**
 * @typedef {import('../lib/io.mjs').CreateIo} CreateIo
 */

/**
 * Extraits d'import, avertissement si l'export manque, éléments requis.
 * @param {CreateIo} io
 * @param {shared.Located} located
 */
function report(io, { root, item, files }) {
  const { exports: exported } = JSON.parse(io.readText(posix.join(root, MANIFEST)));
  for (const file of shared.astroFiles(files)) {
    const base = posix.basename(file);
    const key = `./${base}`;
    io.out(shared.importLine(file, `${PACKAGE_NAME}/${base}`));
    if (!exportsCover(exported, key)) {
      io.err(`avertissement : ${PACKAGE_NAME} n'exporte pas « ${key} », cet import échouera`);
    }
  }
  const required = item.registryDependencies ?? [];
  if (required.length > 0) io.out(`éléments requis : ${required.join(', ')}`);
}

/**
 * `add <élément>` : dépendance au paquet et extrait d'import.
 * @param {{ positionals?: string[], dryRun?: boolean, force?: boolean, from?: string }} args
 * @param {{ io: CreateIo }} ctx
 * @returns {number} code de sortie
 */
export function run({ positionals, dryRun, force, from }, { io }) {
  const located = shared.locate(io, { command: 'add', positionals, from });
  if (!located) return shared.CODE_USAGE;
  const manifest = readManifest(io);
  if (!manifest) return shared.CODE_REFUSED;
  const code = applyPlan(io, dependencyPlan(manifest, located.version), { dryRun, force });
  if (code !== shared.CODE_OK) return code;
  report(io, located);
  return shared.CODE_OK;
}
