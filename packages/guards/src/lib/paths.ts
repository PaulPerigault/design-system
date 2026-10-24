/**
 * Chemin POSIX : `\` devient `/`, sans `./` initial ni `/` final.
 * @param {string} path
 * @returns {string}
 */
export function normalizePath(path) {
  let result = path.replaceAll('\\', '/');
  while (result.startsWith('./')) result = result.slice('./'.length);
  while (result.length > 1 && result.endsWith('/')) result = result.slice(0, -1);
  return result;
}

/** @param {string} path */
const segments = (path) => normalizePath(path).split('/').filter(Boolean);

/**
 * Vrai si les segments de `entry` apparaissent, contigus, dans ceux de `file`.
 * @param {string} file
 * @param {string} entry
 * @returns {boolean}
 */
export function matchesPath(file, entry) {
  const haystack = segments(file);
  const needle = segments(entry);
  if (needle.length === 0) return false;
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((segment, i) => haystack[start + i] === segment)) return true;
  }
  return false;
}

/**
 * @param {string} file
 * @param {readonly string[]} entries
 * @returns {boolean}
 */
export function matchesAny(file, entries) {
  return entries.some((entry) => matchesPath(file, entry));
}
