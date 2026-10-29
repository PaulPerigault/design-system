import { posix } from 'node:path';

const DRIVE = /^[A-Za-z]:(?=\/)/u;

/** Vrai pour `/x` et pour `C:/x` (séparateurs déjà normalisés en `/`). */
export const isAbsolutePath = (path: string): boolean => posix.isAbsolute(path) || DRIVE.test(path);

/** Chemin absolu POSIX d'un chemin relatif à `io.cwd` (un chemin absolu est conservé). */
export function resolveIn(io: { cwd: string }, rel: string): string {
  const path = rel.replaceAll('\\', '/');
  if (DRIVE.test(path)) return posix.normalize(path);
  const drive = DRIVE.exec(io.cwd)?.[0] ?? '';
  return drive + posix.resolve(io.cwd.slice(drive.length), path);
}
