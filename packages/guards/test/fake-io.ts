import { TextDecoder, TextEncoder } from 'node:util';
import type { DirEntry, GuardIo } from '../src/application/ports.ts';

type Content = string | Uint8Array;

const toBytes = (content: Content): Uint8Array =>
  typeof content === 'string' ? new TextEncoder().encode(content) : content;

const notFound = (path: string): Error => new Error(`ENOENT: ${path}`);

/** Dossier -> noms enfants (vrai si dossier), déduits des chemins de fichiers. */
function buildTree(paths: string[]): Map<string, Map<string, boolean>> {
  const tree = new Map<string, Map<string, boolean>>();
  for (const path of paths) {
    const parts = path.split('/');
    parts.forEach((name, i) => {
      const dir = i === 0 ? '.' : parts.slice(0, i).join('/');
      const children = tree.get(dir) ?? new Map<string, boolean>();
      children.set(name, i < parts.length - 1);
      tree.set(dir, children);
    });
  }
  return tree;
}

export interface FakeIo {
  io: GuardIo;
  out: string[];
  err: string[];
}

export function fakeIo(files: Record<string, Content>): FakeIo {
  const out: string[] = [];
  const err: string[] = [];
  const tree = buildTree(Object.keys(files));
  const bytesOf = (path: string): Uint8Array => {
    const content = files[path];
    if (content === undefined) throw notFound(path);
    return toBytes(content);
  };
  const readdir = (dir: string): DirEntry[] => {
    const children = tree.get(dir === '' ? '.' : dir);
    if (!children) throw notFound(dir);
    return [...children].map(([name, isDir]) => ({ name, isDirectory: () => isDir }));
  };
  const io: GuardIo = {
    readText: (path) => new TextDecoder().decode(bytesOf(path)),
    readBytes: bytesOf,
    readdir,
    size: (path) => bytesOf(path).byteLength,
    exists: (path) => path in files || tree.has(path) || path === '.',
    out: (message) => void out.push(message),
    err: (message) => void err.push(message),
  };
  return { io, out, err };
}
