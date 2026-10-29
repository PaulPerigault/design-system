import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';

export interface DirEntry {
  name: string;
  isDirectory: () => boolean;
}

export interface CreateIo {
  /** Absolu, séparateurs `/`, lettre de lecteur admise. */
  cwd: string;
  readText: (path: string) => string;
  /** Crée les dossiers parents. */
  writeText: (path: string, text: string) => void;
  exists: (path: string) => boolean;
  readdir: (dir: string) => DirEntry[];
  out: (message: string) => void;
  err: (message: string) => void;
}

interface Sink {
  write: (text: string) => unknown;
}

const DRIVE = /^[A-Za-z]:(?=\/)/u;

/** Vrai pour `/x` et pour `C:/x` (séparateurs déjà normalisés en `/`). */
const isAbsolutePath = (path: string): boolean => posix.isAbsolute(path) || DRIVE.test(path);

/** Chemin absolu POSIX d'un chemin relatif à `io.cwd` (un chemin absolu est conservé). */
export function resolveIn(io: Pick<CreateIo, 'cwd'>, rel: string): string {
  const path = rel.replaceAll('\\', '/');
  if (DRIVE.test(path)) return posix.normalize(path);
  const drive = DRIVE.exec(io.cwd)?.[0] ?? '';
  return drive + posix.resolve(io.cwd.slice(drive.length), path);
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
    throw new Error(`chemin de travail non absolu (${cwd})`);
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
