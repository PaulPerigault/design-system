/**
 * Lecture du champ `exports` d'un paquet : clé exacte ou motif de sous-chemin.
 */
import { isPlainObject } from '../lib/json.ts';

const WILDCARD = '*';

/** `pattern` : clé d'`exports` avec un seul `*`. */
function matchesPattern(pattern: string, key: string): boolean {
  const star = pattern.indexOf(WILDCARD);
  if (star === -1 || pattern.indexOf(WILDCARD, star + 1) !== -1) return false;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  const fits = key.length >= prefix.length + suffix.length;
  return fits && key.startsWith(prefix) && key.endsWith(suffix);
}

/** Le champ `exports` expose-t-il `key` : clé exacte ou motif de sous-chemin (`./*.astro`) ? */
export function exportsCover(exportsField: unknown, key: string): boolean {
  if (!isPlainObject(exportsField)) return false;
  if (Object.hasOwn(exportsField, key)) return true;
  return Object.entries(exportsField).some(
    ([pattern, target]) => target !== null && matchesPattern(pattern, key),
  );
}
