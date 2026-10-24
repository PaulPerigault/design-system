/**
 * @typedef {object} Problem
 * @property {string} file
 * @property {number} [line]
 * @property {string} message
 */

/** Erreur d'usage ou de configuration (code de sortie 2). */
export class GuardUsageError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'GuardUsageError';
  }
}

/** @param {import('./io.ts').GuardIo} io */
function formatProblem({ file, line, message }) {
  return line === undefined ? `${file}: ${message}` : `${file}:${line}: ${message}`;
}

/**
 * Écrit les problèmes sur `err`, la synthèse sur `out`. Retourne le code de sortie.
 * @param {import('./io.ts').GuardIo} io
 * @param {{ name: string, problems: Problem[], checked: number }} result
 * @returns {0 | 1}
 */
export function report(io, { name, problems, checked }) {
  for (const problem of problems) io.err(formatProblem(problem));
  if (problems.length === 0) {
    io.out(`${name} : OK (${checked} fichiers)`);
    return 0;
  }
  io.out(`${name} : ${problems.length} problème(s) sur ${checked} fichiers`);
  return 1;
}
