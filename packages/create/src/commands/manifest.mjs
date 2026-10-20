import { resolveIn } from '../lib/io.mjs';
import { PACKAGE_NAME } from '../lib/registry.mjs';

/**
 * Lecture et réécriture du `package.json` du projet, et lecture des `exports` du paquet.
 */

export const MANIFEST = 'package.json';
const DEFAULT_INDENT = '  ';
const INDENT_PATTERN = /^([ \t]+)"/m;
const CRLF = '\r\n';
const WILDCARD = '*';

/**
 * @typedef {import('../lib/io.mjs').CreateIo} CreateIo
 * @typedef {{ text: string, data: Record<string, unknown> }} Manifest
 */

/** @param {unknown} value */
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** @param {unknown} error */
const messageOf = (error) => (error instanceof Error ? error.message : String(error));

/**
 * @param {CreateIo} io
 * @param {string} text
 * @returns {Manifest | null} `null` (message sur `io.err`) si illisible ou pas un objet
 */
function parseManifest(io, text) {
  try {
    const data = JSON.parse(text);
    if (isPlainObject(data)) return { text, data };
    io.err(`${MANIFEST} doit contenir un objet JSON`);
  } catch (error) {
    io.err(`${MANIFEST} illisible (JSON invalide) : ${messageOf(error)}`);
  }
  return null;
}

/**
 * @param {CreateIo} io
 * @returns {Manifest | null} `null` (message sur `io.err`) si absent ou inutilisable
 */
export function readManifest(io) {
  const path = resolveIn(io, MANIFEST);
  if (!io.exists(path)) {
    io.err(`${MANIFEST} introuvable dans ${io.cwd} : add ajoute ${PACKAGE_NAME} à ses dépendances`);
    return null;
  }
  return parseManifest(io, io.readText(path));
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
 * Sérialise comme le fichier d'origine : indentation (aucune si minifié), fin de ligne, retour final.
 * @param {string} original
 * @param {unknown} data
 * @returns {string}
 */
function serializeLike(original, data) {
  const indent = INDENT_PATTERN.exec(original)?.[1] ?? '';
  const json = JSON.stringify(data, null, indent === '' ? undefined : indent);
  const eol = original.includes(CRLF) ? CRLF : '\n';
  const body = eol === CRLF ? json.replaceAll('\n', CRLF) : json;
  return original.endsWith('\n') ? `${body}${eol}` : body;
}

/**
 * Plan d'écriture du manifeste : vide si le paquet y figure déjà.
 * @param {Manifest} manifest
 * @param {string} version version exacte installée
 * @returns {import('../lib/plan.mjs').PlanEntry[]}
 */
export function dependencyPlan({ text, data }, version) {
  const has = (field) => Object.hasOwn(data[field] ?? {}, PACKAGE_NAME);
  if (has('dependencies') || has('devDependencies')) return [];
  const dependencies = insertDependency(data.dependencies ?? {}, version);
  const content = serializeLike(text, { ...data, dependencies });
  return [{ path: MANIFEST, content, overwrite: true }];
}

/**
 * @param {string} pattern clé d'`exports` avec un seul `*`
 * @param {string} key
 * @returns {boolean}
 */
function matchesPattern(pattern, key) {
  const star = pattern.indexOf(WILDCARD);
  if (star === -1 || pattern.indexOf(WILDCARD, star + 1) !== -1) return false;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  return key.length > prefix.length + suffix.length - 1 && key.startsWith(prefix) && key.endsWith(suffix);
}

/**
 * Le champ `exports` expose-t-il `key` : clé exacte ou motif de sous-chemin (`./*.astro`) ?
 * @param {unknown} exportsField
 * @param {string} key
 * @returns {boolean}
 */
export function exportsCover(exportsField, key) {
  if (!isPlainObject(exportsField)) return false;
  if (Object.hasOwn(exportsField, key)) return true;
  return Object.entries(exportsField).some(
    ([pattern, target]) => target !== null && matchesPattern(pattern, key),
  );
}
