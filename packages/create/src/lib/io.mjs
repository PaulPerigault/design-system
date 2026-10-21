import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';

/**
 * @typedef {object} CreateIo
 * @property {string} cwd absolu, POSIX
 * @property {(path: string) => string} readText
 * @property {(path: string, text: string) => void} writeText crée les dossiers parents
 * @property {(path: string) => boolean} exists
 * @property {(dir: string) => { name: string, isDirectory: () => boolean }[]} readdir
 * @property {(message: string) => void} out
 * @property {(message: string) => void} err
 */

/**
 * Chemin absolu POSIX d'un chemin relatif à `io.cwd` (un chemin absolu est conservé).
 * @param {{ cwd: string }} io
 * @param {string} rel
 * @returns {string}
 */
export function resolveIn(io, rel) {
  return posix.resolve(io.cwd, rel);
}

/**
 * Implémentation `node:fs`.
 * @param {{ cwd: string, stdout: { write: (s: string) => unknown }, stderr: { write: (s: string) => unknown } }} streams
 * @returns {CreateIo}
 */
export function nodeIo({ cwd, stdout, stderr }) {
  const posixCwd = cwd.split('\\').join('/');
  if (!posix.isAbsolute(posixCwd)) {
    throw new Error(
      `chemin de travail non POSIX : Windows non pris en charge pour l'instant (${cwd})`,
    );
  }
  return {
    cwd: posixCwd,
    readText: (path) => readFileSync(path, 'utf8'),
    writeText(path, text) {
      mkdirSync(posix.dirname(path), { recursive: true });
      writeFileSync(path, text, 'utf8');
    },
    exists: (path) => existsSync(path),
    readdir: (dir) => readdirSync(dir, { withFileTypes: true }),
    out: (message) => void stdout.write(`${message}\n`),
    err: (message) => void stderr.write(`${message}\n`),
  };
}
