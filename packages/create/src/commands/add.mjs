import { posix } from 'node:path';
import { resolveIn } from '../lib/io.mjs';
import { applyPlan } from '../lib/plan.mjs';
import { PACKAGE_NAME } from '../lib/registry.mjs';
import * as shared from './snippet.mjs';

const MANIFEST = 'package.json';
const DEFAULT_INDENT = '  ';
const INDENT_PATTERN = /^([ \t]+)"/m;

/**
 * @typedef {import('../lib/io.mjs').CreateIo} CreateIo
 * @typedef {{ text: string, data: Record<string, unknown> }} Manifest
 */

/**
 * @param {CreateIo} io
 * @returns {Manifest | null} `null` (message sur `io.err`) si absent ou illisible
 */
function readManifest(io) {
  const path = resolveIn(io, MANIFEST);
  if (!io.exists(path)) {
    io.err(`${MANIFEST} introuvable dans ${io.cwd} : add ajoute ${PACKAGE_NAME} à ses dépendances`);
    return null;
  }
  const text = io.readText(path);
  try {
    return { text, data: JSON.parse(text) };
  } catch (error) {
    io.err(`${MANIFEST} illisible (JSON invalide) : ${shared.messageOf(error)}`);
    return null;
  }
}

/**
 * Dépendances avec le paquet inséré à sa place alphabétique, ordre des autres clés conservé.
 * @param {Record<string, string>} deps
 * @param {string} version
 * @returns {Record<string, string>}
 */
function insertDependency(deps, version) {
  const entries = Object.entries(deps);
  const at = entries.findIndex(([name]) => name > PACKAGE_NAME);
  entries.splice(at === -1 ? entries.length : at, 0, [PACKAGE_NAME, version]);
  return Object.fromEntries(entries);
}

/**
 * Plan d'écriture du manifeste : vide si le paquet y figure déjà.
 * @param {Manifest} manifest
 * @param {string} version version exacte installée
 * @returns {import('../lib/plan.mjs').PlanEntry[]}
 */
function dependencyPlan({ text, data }, version) {
  const has = (field) => Object.hasOwn(data[field] ?? {}, PACKAGE_NAME);
  if (has('dependencies') || has('devDependencies')) return [];
  const dependencies = insertDependency(data.dependencies ?? {}, version);
  const indent = INDENT_PATTERN.exec(text)?.[1] ?? DEFAULT_INDENT;
  const ending = text.endsWith('\n') ? '\n' : '';
  const content = `${JSON.stringify({ ...data, dependencies }, null, indent)}${ending}`;
  return [{ path: MANIFEST, content, overwrite: true }];
}

/**
 * Extraits d'import, avertissement si l'export manque, éléments requis.
 * @param {CreateIo} io
 * @param {shared.Located} located
 */
function report(io, { root, item, files }) {
  const manifest = JSON.parse(io.readText(posix.join(root, MANIFEST)));
  const exported = manifest.exports !== null && typeof manifest.exports === 'object';
  for (const file of shared.astroFiles(files)) {
    const base = posix.basename(file);
    const key = `./${base}`;
    io.out(shared.importLine(file, `${PACKAGE_NAME}/${base}`));
    if (!exported || !Object.hasOwn(manifest.exports, key)) {
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
