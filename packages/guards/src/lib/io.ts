import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { Dirent } from 'node:fs';

export interface GuardIo {
  readText: (path: string) => string;
  readBytes: (path: string) => Uint8Array;
  readdir: (dir: string) => Dirent[];
  size: (path: string) => number;
  exists: (path: string) => boolean;
  out: (message: string) => void;
  err: (message: string) => void;
}

export function nodeIo({ stdout, stderr }: { stdout: { write: (s: string) => unknown }; stderr: { write: (s: string) => unknown } }): GuardIo {
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
