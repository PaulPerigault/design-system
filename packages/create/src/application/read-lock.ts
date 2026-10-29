import { emptyLock, LOCK_FILE, toLock } from '../domain/lock.ts';
import type { Lock } from '../domain/lock.ts';
import { resolveIn } from '../domain/paths.ts';
import { CreateError } from '../errors.ts';
import type { CreateIo } from './ports.ts';

function parseLock(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new CreateError(
      'lock.unreadable',
      `${LOCK_FILE} illisible (JSON invalide)`,
      {},
      { cause },
    );
  }
}

/** Lit le verrou ; absent → verrou vide. */
export function readLock(io: CreateIo): Lock {
  const path = resolveIn(io, LOCK_FILE);
  if (!io.exists(path)) return emptyLock();
  return toLock(parseLock(io.readText(path)));
}
