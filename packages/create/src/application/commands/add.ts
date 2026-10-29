import { posix } from 'node:path';
import { isPlainObject } from '../../domain/json.ts';
import { exportsCover } from '../../domain/exports-cover.ts';
import { dependencyPlan, MANIFEST } from '../../domain/manifest.ts';
import type { PlanOptions } from '../../domain/plan.ts';
import { PACKAGE_NAME } from '../../domain/registry.ts';
import { astroFiles, CODE_OK, CODE_REFUSED, CODE_USAGE, importLine } from '../../domain/snippet.ts';
import { applyPlan } from '../apply-plan.ts';
import { locate } from '../locate.ts';
import type { Located } from '../locate.ts';
import type { CreateIo } from '../ports.ts';
import { readManifest } from '../read-manifest.ts';

export interface AddArgs extends PlanOptions {
  positionals?: string[] | undefined;
  from?: string | undefined;
}

/** Champ `exports` du `package.json` du paquet installé. */
function exportsOf(io: CreateIo, root: string): unknown {
  const manifest: unknown = JSON.parse(io.readText(posix.join(root, MANIFEST)));
  return isPlainObject(manifest) ? manifest.exports : undefined;
}

/** Extraits d'import, avertissement si l'export manque, éléments requis. */
function report(io: CreateIo, { root, item, files }: Located): void {
  const exported = exportsOf(io, root);
  for (const file of astroFiles(files)) {
    const base = posix.basename(file);
    const key = `./${base}`;
    io.out(importLine(file, `${PACKAGE_NAME}/${base}`));
    if (!exportsCover(exported, key)) {
      io.err(`avertissement : ${PACKAGE_NAME} n'exporte pas « ${key} », cet import échouera`);
    }
  }
  const required = item.registryDependencies ?? [];
  if (required.length > 0) io.out(`éléments requis : ${required.join(', ')}`);
}

/** `add <élément>` : dépendance au paquet et extrait d'import. Rend le code de sortie. */
export function run(
  { positionals, dryRun, force, from }: AddArgs,
  { io }: { io: CreateIo },
): number {
  const located = locate(io, { command: 'add', positionals, from });
  if (!located) return CODE_USAGE;
  const manifest = readManifest(io);
  if (!manifest) return CODE_REFUSED;
  const code = applyPlan(io, dependencyPlan(manifest, located.version), { dryRun, force });
  if (code !== CODE_OK) return code;
  report(io, located);
  return CODE_OK;
}
