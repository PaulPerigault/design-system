import { posix } from 'node:path';
import { sha256 } from '../lib/hash.ts';
import type { CreateIo } from '../lib/io.ts';
import { resolveIn } from '../lib/io.ts';
import { LOCK_FILE, readLock, serializeLock, withItem } from '../lib/lock.ts';
import { applyPlan } from '../lib/plan.ts';
import type { PlanOptions } from '../lib/plan.ts';
import { PACKAGE_NAME } from '../lib/registry.ts';
import * as shared from './snippet.ts';

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
    io.err(shared.messageOf(error));
    return null;
  }
}

/** Copies prévues : `src/layout/Stack.astro` → `<out>/layout/Stack.astro`. */
function plannedCopies(io: CreateIo, { root, files }: shared.Located, out: string): Copy[] {
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
  for (const path of shared.astroFiles(copies.map((copy) => copy.path))) {
    const rel = posix.relative(resolveIn(io, SRC_DIR), resolveIn(io, path));
    io.out(shared.importLine(path, rel.startsWith('../') ? rel : `./${rel}`));
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
  const located = shared.locate(io, { command: 'eject', positionals, from });
  if (!located) return shared.CODE_USAGE;
  const copies = attempt(io, () => plannedCopies(io, located, out));
  if (!copies) return shared.CODE_USAGE;
  const lock = attempt(io, () => readLock(io));
  if (!lock) return shared.CODE_REFUSED;
  const { name } = located.item;
  const locked = Object.hasOwn(lock.items, name) && !force;
  if (reportConflicts(io, { name, locked, copies })) return shared.CODE_REFUSED;
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
  if (code !== shared.CODE_OK) return code;
  report(io, name, copies);
  return shared.CODE_OK;
}
