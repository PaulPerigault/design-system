// Lecture de la sortie de `npm pack --json` : les scripts `prepack` écrivent aussi sur la sortie
// standard, le tableau JSON est donc cherché à partir de la ligne `[` seule, jusqu'au `]` final.
/** @returns {object[]} entrées du tableau JSON, `[]` si la sortie n'en contient pas */
export function parsePackOutput(stdout) {
  if (typeof stdout !== 'string') return [];
  const start = stdout.search(/^\[\s*$/m);
  const end = stdout.lastIndexOf(']');
  if (start === -1 || end < start) return [];
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return [];
  }
}
