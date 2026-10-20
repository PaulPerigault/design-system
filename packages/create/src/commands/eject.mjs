import { posix } from 'node:path';
import { sha256 } from '../lib/hash.mjs';
import { resolveIn } from '../lib/io.mjs';
import { LOCK_FILE, readLock, serializeLock, withItem } from '../lib/lock.mjs';
import { applyPlan } from '../lib/plan.mjs';
import { PACKAGE_NAME } from '../lib/registry.mjs';
import * as shared from './snippet.mjs';

export const DEFAULT_OUT = 'src/components/pp';
const SRC_DIR = 'src';
const SRC_PREFIX = `${SRC_DIR}/`;

/**
 * @typedef {import('../lib/io.mjs').CreateIo} CreateIo
 * @typedef {{ source: string, path: string, content: string }} Copy
 */

/**
 * @template T
 * @param {CreateIo} io
 * @param {() => T} task
 * @returns {T | null} `null` (message sur `io.err`) si `task` lève
 */
function attempt(io, task) {
  try {
    return task();
  } catch (error) {
    io.err(shared.messageOf(error));
    return null;
  }
}

/**
 * Copies prévues : `src/layout/Stack.astro` → `<out>/layout/Stack.astro`.
 * @param {CreateIo} io
 * @param {shared.Located} located
 * @param {string} out
 * @returns {Copy[]}
 */
function plannedCopies(io, { root, files }, out) {
  return files.map((source) => {
    const rel = source.startsWith(SRC_PREFIX) ? source.slice(SRC_PREFIX.length) : source;
    const content = io.readText(posix.join(root, source));
    return { source, path: posix.join(out, rel), content };
  });
}

/**
 * Sans `--force` : élément déjà au verrou ou fichier cible existant. Liste tous les conflits.
 * @param {CreateIo} io
 * @param {{ name: string, locked: boolean, copies: Copy[] }} state
 * @returns {boolean} vrai s'il y a conflit
 */
function reportConflicts(io, { name, locked, copies }) {
  if (!locked) return false;
  io.err(`conflit : « ${name} » figure déjà dans ${LOCK_FILE}`);
  copies
    .filter((copy) => io.exists(resolveIn(io, copy.path)))
    .forEach((copy) => io.err(`conflit : ${copy.path} existe déjà`));
  return true;
}

/**
 * Import de la copie, relatif à `src/`.
 * @param {CreateIo} io
 * @param {string} name
 * @param {Copy[]} copies
 */
function report(io, name, copies) {
  for (const path of shared.astroFiles(copies.map((copy) => copy.path))) {
    const rel = posix.relative(resolveIn(io, SRC_DIR), resolveIn(io, path));
    io.out(shared.importLine(path, rel.startsWith('../') ? rel : `./${rel}`));
  }
  io.out(`diff ${name} compare cette copie au paquet installé`);
}

/**
 * `eject <élément>` : copie les sources dans le projet et les inscrit au verrou.
 * @param {{ positionals?: string[], dryRun?: boolean, force?: boolean, from?: string,
 *   out?: string }} args
 * @param {{ io: CreateIo }} ctx
 * @returns {number} code de sortie
 */
export function run({ positionals, dryRun, force, from, out = DEFAULT_OUT }, { io }) {
  const located = shared.locate(io, { command: 'eject', positionals, from });
  if (!located) return shared.CODE_USAGE;
  const copies = attempt(io, () => plannedCopies(io, located, out));
  if (!copies) return shared.CODE_USAGE;
  const lock = attempt(io, () => readLock(io));
  if (!lock) return shared.CODE_REFUSED;
  const { name } = located.item;
  const locked = Object.hasOwn(lock.items, name) && !force;
  if (reportConflicts(io, { name, locked, copies })) return shared.CODE_REFUSED;
  const files = copies.map(({ source, path, content }) => ({
    source,
    path,
    sha256: sha256(content),
  }));
  const entry = { package: PACKAGE_NAME, version: located.version, files };
  const plan = [
    ...copies.map(({ path, content }) => ({ path, content })),
    { path: LOCK_FILE, content: serializeLock(withItem(lock, name, entry)), overwrite: true },
  ];
  const code = applyPlan(io, plan, { dryRun, force });
  if (code !== shared.CODE_OK) return code;
  report(io, name, copies);
  return shared.CODE_OK;
}
