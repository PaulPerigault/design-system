import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';

/**
 * Entrées-sorties injectées dans chaque contrôle. Chemins POSIX relatifs au dossier courant.
 * @typedef {object} GuardIo
 * @property {(path: string) => string} readText      // UTF-8
 * @property {(path: string) => Uint8Array} readBytes
 * @property {(dir: string) => { name: string, isDirectory: () => boolean }[]} readdir
 * @property {(path: string) => number} size          // octets
 * @property {(path: string) => boolean} exists
 * @property {(message: string) => void} out
 * @property {(message: string) => void} err
 */

/**
 * Implémentation réelle, synchrone, sur `node:fs`.
 * @param {{ stdout: { write: (s: string) => unknown }, stderr: { write: (s: string) => unknown } }} streams
 * @returns {GuardIo}
 */
export function nodeIo({ stdout, stderr }) {
  return {
    readText: (path) => readFileSync(path, 'utf8'),
    readBytes: (path) => new Uint8Array(readFileSync(path)),
    readdir: (dir) => readdirSync(dir, { withFileTypes: true }),
    size: (path) => statSync(path).size,
    exists: (path) => existsSync(path),
    out: (message) => void stdout.write(`${message}\n`),
    err: (message) => void stderr.write(`${message}\n`),
  };
}
