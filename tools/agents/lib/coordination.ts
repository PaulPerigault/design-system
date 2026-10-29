// Câblage réel de la coordination entre processus (locks.mjs, seed.mjs) dans le dossier partagé
// `.agents/` du dépôt principal : places Kiro, verrou des tâches lourdes, amorces node_modules.
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { acquireLock, acquireSlot, isHeavy, lowerMax } from './locks.ts';
import { installDependencies } from './seed.ts';
import type { HeavyLock, Shell } from './types.ts';
import type { InstallOptions } from './deps.ts';

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Racine du dépôt principal (même depuis un worktree) : parent du dossier git commun. */
export function mainRoot(cwd: string, env: Record<string, string>): string {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd,
    env,
    encoding: 'utf8',
  }).trim();
  return common.replace(/\/\.git\/?$/, '');
}

export function coordination({ sharedDir, shell }: { sharedDir: string; shell: Shell }) {
  const io = { fs, isAlive, sleep, now: Date.now, pid: process.pid };
  const slots = join(sharedDir, 'slots');
  return {
    install: (opts: InstallOptions) =>
      installDependencies({ shell, fs, seedsDir: join(sharedDir, 'seeds'), ...opts }),
    slot: () => acquireSlot(io, slots),
    onQuota: () => lowerMax(io, slots),
    heavyLock: (cmd: string): ReturnType<HeavyLock> =>
      isHeavy(cmd) ? acquireLock(io, join(sharedDir, 'locks', 'heavy')) : null,
  };
}
