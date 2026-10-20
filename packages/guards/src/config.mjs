// Configuration de pp-guards : lecture de pp-guards.config.json et fusion des options.
import { GuardUsageError } from './lib/report.mjs';

export const CONFIG_FILE = 'pp-guards.config.json';

/**
 * @param {string} text
 * @param {string} path
 * @returns {Record<string, unknown>}
 */
function parseConfig(text, path) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new GuardUsageError(`${path} : JSON invalide (${error.message})`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new GuardUsageError(`${path} : un objet JSON est attendu`);
  }
  return data;
}

/**
 * @param {import('./lib/io.mjs').GuardIo} io
 * @param {string} [path] valeur de `--config`
 * @returns {Record<string, unknown>}
 */
export function loadConfig(io, path) {
  if (path !== undefined && !io.exists(path)) {
    throw new GuardUsageError(`configuration introuvable : ${path}`);
  }
  const file = path ?? CONFIG_FILE;
  return io.exists(file) ? parseConfig(io.readText(file), file) : {};
}

/**
 * Défauts, puis section du fichier, puis drapeaux ; un tableau remplace. Pure.
 * @param {object} defaults
 * @param {object | undefined} section
 * @param {object} flags
 * @param {string[]} positionals
 * @returns {Record<string, unknown>}
 */
export function mergeOptions(defaults, section, flags, positionals) {
  const merged = { ...defaults, ...section, ...flags };
  return positionals.length > 0 ? { ...merged, roots: [...positionals] } : merged;
}
