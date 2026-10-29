import { posix } from 'node:path';
import type { CreateIo } from '../lib/io.ts';
import { isPlainObject } from '../lib/json.ts';
import { applyPlan } from '../lib/plan.ts';
import type { PlanOptions } from '../lib/plan.ts';
import { PACKAGE_NAME } from '../lib/registry.ts';
import { exportsCover } from './exports.ts';
import { dependencyPlan, MANIFEST, readManifest } from './manifest.ts';
import * as shared from './snippet.ts';

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
function report(io: CreateIo, { root, item, files }: shared.Located): void {
  const exported = exportsOf(io, root);
  for (const file of shared.astroFiles(files)) {
    const base = posix.basename(file);
    const key = `./${base}`;
    io.out(shared.importLine(file, `${PACKAGE_NAME}/${base}`));
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
  const located = shared.locate(io, { command: 'add', positionals, from });
  if (!located) return shared.CODE_USAGE;
  const manifest = readManifest(io);
  if (!manifest) return shared.CODE_REFUSED;
  const code = applyPlan(io, dependencyPlan(manifest, located.version), { dryRun, force });
  if (code !== shared.CODE_OK) return code;
  report(io, located);
  return shared.CODE_OK;
}
