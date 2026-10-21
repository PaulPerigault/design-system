import { posix } from 'node:path';
import { PACKAGE_NAME, REPO_PREFIX } from '../src/lib/registry.mjs';

/**
 * FS en mémoire. `files` : chemins absolus → contenu, reflète les écritures.
 * @param {Record<string, string>} files
 * @param {{ cwd?: string }} [options]
 */
export function fakeIo(files, { cwd = '/projet' } = {}) {
  const out = [];
  const err = [];
  const isDir = (path) => Object.keys(files).some((file) => file.startsWith(`${path}/`));
  const io = {
    cwd,
    readText(path) {
      if (!(path in files)) throw new Error(`ENOENT: ${path}`);
      return files[path];
    },
    writeText(path, text) {
      files[path] = text;
    },
    exists: (path) => path in files || isDir(path),
    readdir(dir) {
      if (!isDir(dir)) throw new Error(`ENOENT: ${dir}`);
      const names = new Map();
      for (const file of Object.keys(files).filter((f) => f.startsWith(`${dir}/`))) {
        const [name, ...rest] = file.slice(dir.length + 1).split('/');
        names.set(name, rest.length > 0);
      }
      return [...names].map(([name, directory]) => ({ name, isDirectory: () => directory }));
    },
    out: (message) => out.push(message),
    err: (message) => err.push(message),
  };
  return { io, files, out, err };
}

const stripPrefix = (path) =>
  path.startsWith(REPO_PREFIX) ? path.slice(REPO_PREFIX.length) : path;

/**
 * Ajoute un `@paulperigault/astro` installé : manifeste, fragments et sources.
 * @param {Record<string, string>} files
 * @param {{ name: string, title?: string, files: { path: string }[] }[]} items
 * @param {{ cwd?: string, version?: string, sources?: Record<string, string> }} [options]
 */
export function fakePackage(files, items, { cwd = '/projet', version = '1.2.3', sources } = {}) {
  const root = posix.join(cwd, 'node_modules', PACKAGE_NAME);
  files[`${root}/package.json`] = JSON.stringify({ name: PACKAGE_NAME, version });
  for (const item of items) {
    files[`${root}/registry/items/${item.name}.json`] = JSON.stringify(item);
    for (const { path } of item.files) {
      const rel = stripPrefix(path);
      files[`${root}/${rel}`] = sources?.[rel] ?? `<!-- ${item.name} -->\n`;
    }
  }
  return files;
}
