import { resolveIn } from '../lib/io.mjs';
import { PACKAGE_NAME } from '../lib/registry.mjs';
import { isPlainObject } from './exports.mjs';
import { messageOf } from './snippet.mjs';

/**
 * Lecture et réécriture du `package.json` du projet.
 */

export const MANIFEST = 'package.json';
const INDENT_PATTERN = /^([ \t]+)"/m;
const CRLF = '\r\n';

/**
 * @typedef {import('../lib/io.mjs').CreateIo} CreateIo
 * @typedef {{ text: string, data: Record<string, unknown> }} Manifest
 */

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
 * Sérialise comme l'original : indentation (aucune si minifié), fin de ligne, retour final.
 * @param {string} original
 * @param {unknown} data
 * @returns {string}
 */
function serializeLike(original, data) {
  const indent = INDENT_PATTERN.exec(original)?.[1];
  const json = JSON.stringify(data, null, indent);
  const eol = original.includes(CRLF) ? CRLF : '\n';
  const body = json.replaceAll('\n', eol);
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
