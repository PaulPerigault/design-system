import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import type { GuardIo } from '../application/ports.ts';

export function nodeIo({
  stdout,
  stderr,
}: {
  stdout: { write: (s: string) => unknown };
  stderr: { write: (s: string) => unknown };
}): GuardIo {
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
