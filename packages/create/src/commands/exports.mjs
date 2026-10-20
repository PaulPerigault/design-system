/**
 * Lecture du champ `exports` d'un paquet : clé exacte ou motif de sous-chemin.
 */

const WILDCARD = '*';

/** @param {unknown} value */
export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

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
  const fits = key.length >= prefix.length + suffix.length;
  return fits && key.startsWith(prefix) && key.endsWith(suffix);
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
