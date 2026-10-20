import { TextDecoder, TextEncoder } from 'node:util';

/** @param {string | Uint8Array} content */
const toBytes = (content) =>
  typeof content === 'string' ? new TextEncoder().encode(content) : content;

/** @param {string} path */
const notFound = (path) => new Error(`ENOENT: ${path}`);

/**
 * Dossier -> noms enfants, déduits des chemins de fichiers.
 * @param {string[]} paths
 * @returns {Map<string, Map<string, boolean>>}
 */
function buildTree(paths) {
  const tree = new Map();
  for (const path of paths) {
    const parts = path.split('/');
    parts.forEach((name, i) => {
      const dir = i === 0 ? '.' : parts.slice(0, i).join('/');
      if (!tree.has(dir)) tree.set(dir, new Map());
      tree.get(dir).set(name, i < parts.length - 1);
    });
  }
  return tree;
}

/**
 * @param {Record<string, string | Uint8Array>} files
 * @returns {{ io: import('../src/lib/io.mjs').GuardIo, out: string[], err: string[] }}
 */
export function fakeIo(files) {
  const out = [];
  const err = [];
  const tree = buildTree(Object.keys(files));
  const bytesOf = (path) => {
    if (!(path in files)) throw notFound(path);
    return toBytes(files[path]);
  };
  const io = {
    readText: (path) => new TextDecoder().decode(bytesOf(path)),
    readBytes: bytesOf,
    readdir: (dir) => {
      const children = tree.get(dir === '' ? '.' : dir);
      if (!children) throw notFound(dir);
      return [...children].map(([name, isDir]) => ({ name, isDirectory: () => isDir }));
    },
    size: (path) => bytesOf(path).byteLength,
    exists: (path) => path in files || tree.has(path) || path === '.',
    out: (message) => void out.push(message),
    err: (message) => void err.push(message),
  };
  return { io, out, err };
}
