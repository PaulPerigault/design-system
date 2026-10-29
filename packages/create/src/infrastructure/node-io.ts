import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';
import type { CreateIo } from '../application/ports.ts';
import { isAbsolutePath } from '../domain/paths.ts';
import { CreateError } from '../errors.ts';

interface Sink {
  write: (text: string) => unknown;
}

/** Implémentation `node:fs`. */
export function nodeIo({
  cwd,
  stdout,
  stderr,
}: {
  cwd: string;
  stdout: Sink;
  stderr: Sink;
}): CreateIo {
  const posixCwd = cwd.split('\\').join('/');
  if (!isAbsolutePath(posixCwd)) {
    throw new CreateError('io.cwd-relative', `chemin de travail non absolu (${cwd})`, { cwd });
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
