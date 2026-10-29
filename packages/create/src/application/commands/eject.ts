import { posix } from 'node:path';
import { sha256 } from '../../domain/hash.ts';
import { LOCK_FILE, serializeLock, withItem } from '../../domain/lock.ts';
import { resolveIn } from '../../domain/paths.ts';
import type { PlanOptions } from '../../domain/plan.ts';
import { PACKAGE_NAME } from '../../domain/registry.ts';
import {
  astroFiles,
  CODE_OK,
  CODE_REFUSED,
  CODE_USAGE,
  importLine,
  messageOf,
} from '../../domain/snippet.ts';
import { applyPlan } from '../apply-plan.ts';
import { locate } from '../locate.ts';
import type { Located } from '../locate.ts';
import type { CreateIo } from '../ports.ts';
import { readLock } from '../read-lock.ts';

export const DEFAULT_OUT = 'src/components/pp';
const SRC_DIR = 'src';
const SRC_PREFIX = `${SRC_DIR}/`;

interface Copy {
  source: string;
  path: string;
  content: string;
}

/** `null` (message sur `io.err`) si `task` lève. */
function attempt<T>(io: CreateIo, task: () => T): T | null {
  try {
    return task();
  } catch (error) {
    io.err(messageOf(error));
    return null;
  }
}

/** Copies prévues : `src/layout/Stack.astro` → `<out>/layout/Stack.astro`. */
function plannedCopies(io: CreateIo, { root, files }: Located, out: string): Copy[] {
  return files.map((source) => {
    const rel = source.startsWith(SRC_PREFIX) ? source.slice(SRC_PREFIX.length) : source;
    const content = io.readText(posix.join(root, source));
    return { source, path: posix.join(out, rel), content };
  });
}

/**
 * Sans `--force` : élément déjà au verrou ou fichier cible existant. Liste tous les conflits.
 * Vrai s'il y a conflit.
 */
function reportConflicts(
  io: CreateIo,
  { name, locked, copies }: { name: string; locked: boolean; copies: Copy[] },
): boolean {
  if (!locked) return false;
  io.err(`conflit : « ${name} » figure déjà dans ${LOCK_FILE}`);
  copies
    .filter((copy) => io.exists(resolveIn(io, copy.path)))
    .forEach((copy) => io.err(`conflit : ${copy.path} existe déjà`));
  return true;
}

/** Import de la copie, relatif à `src/`. */
function report(io: CreateIo, name: string, copies: Copy[]): void {
  for (const path of astroFiles(copies.map((copy) => copy.path))) {
    const rel = posix.relative(resolveIn(io, SRC_DIR), resolveIn(io, path));
    io.out(importLine(path, rel.startsWith('../') ? rel : `./${rel}`));
  }
  io.out(`diff ${name} compare cette copie au paquet installé`);
}

export interface EjectArgs extends PlanOptions {
  positionals?: string[] | undefined;
  from?: string | undefined;
  out?: string | undefined;
}

/** `eject <élément>` : copie les sources dans le projet et les inscrit au verrou. */
export function run(
  { positionals, dryRun, force, from, out = DEFAULT_OUT }: EjectArgs,
  { io }: { io: CreateIo },
): number {
  const located = locate(io, { command: 'eject', positionals, from });
  if (!located) return CODE_USAGE;
  const copies = attempt(io, () => plannedCopies(io, located, out));
  if (!copies) return CODE_USAGE;
  const lock = attempt(io, () => readLock(io));
  if (!lock) return CODE_REFUSED;
  const { name } = located.item;
  const locked = Object.hasOwn(lock.items, name) && !force;
  if (reportConflicts(io, { name, locked, copies })) return CODE_REFUSED;
  const files = copies.map(({ source, path, content }) => ({
    source,
    path,
    sha256: sha256(content),
  }));
  const entry = { package: PACKAGE_NAME, version: located.version, files };
  const plan = [
    ...copies.map(({ path, content }) => ({ path, content })),
    { path: LOCK_FILE, content: serializeLock(withItem(lock, name, entry)), overwrite: true },
  ];
  const code = applyPlan(io, plan, { dryRun, force });
  if (code !== CODE_OK) return code;
  report(io, name, copies);
  return CODE_OK;
}
