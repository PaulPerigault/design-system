import { posix } from 'node:path';
import type { CreateIo } from '../lib/io.ts';
import { resolveIn } from '../lib/io.ts';
import { applyPlan } from '../lib/plan.ts';
import type { PlanEntry } from '../lib/plan.ts';
import { sitePackageJson } from '../site/package-json.ts';
import { outputPath } from '../site/template.ts';
import type { SiteTemplate } from '../site/template.ts';

const CODE_OK = 0;
const CODE_REFUSED = 1;
const CODE_USAGE = 2;
const SAFE_PATH = /^[\w./-]+$/;
const USAGE = 'usage : create <dossier> [--dry-run]';

/** Vrai si `abs` existe et n'est pas un dossier vide (un fichier compte comme occupé). */
function isOccupied(io: CreateIo, abs: string): boolean {
  if (!io.exists(abs)) return false;
  try {
    return io.readdir(abs).length > 0;
  } catch {
    return true;
  }
}

/**
 * Plan d'écriture : `package.json` généré puis fichiers du gabarit, `_` → `.`.
 * `dir` : dossier cible tel que saisi ; `name` : dernier segment du dossier résolu.
 */
function sitePlan(dir: string, template: SiteTemplate, name: string): PlanEntry[] {
  const files = [
    { path: 'package.json', content: sitePackageJson(name, template.versions) },
    ...template.files.map(({ path, content }) => ({ path: outputPath(path), content })),
  ];
  return files
    .sort((a, b) => (a.path < b.path ? -1 : Number(a.path > b.path)))
    .map(({ path, content }) => ({ path: posix.join(dir, path), content }));
}

/** Dossier prêt pour un shell : entre guillemets simples dès qu'un caractère sort de `[\w./-]`. */
function shellQuote(dir: string): string {
  return SAFE_PATH.test(dir) ? dir : `'${dir.replaceAll("'", "'\\''")}'`;
}

function nextSteps(io: CreateIo, dir: string): void {
  io.out('');
  io.out('Prochaines étapes :');
  for (const step of [
    `cd ${shellQuote(dir)}`,
    'git init',
    'npm install',
    'npm run dev',
    'npm run verify',
  ]) {
    io.out(`  ${step}`);
  }
  io.out('Commitez package-lock.json avant la première CI (npm ci l’exige).');
}

export interface CreateArgs {
  positionals?: string[] | undefined;
  dryRun?: boolean | undefined;
}

/**
 * `create <dossier>` : site Astro minimal consommateur du design system.
 * Ne génère jamais dans un dossier non vide, même avec `--force`. Rend le code de sortie.
 */
export function run(
  { positionals = [], dryRun = false }: CreateArgs,
  { io, template }: { io: CreateIo; template: SiteTemplate | undefined },
): number {
  const [dir] = positionals;
  if (positionals.length !== 1 || dir === undefined || template === undefined) {
    io.err(USAGE);
    return CODE_USAGE;
  }
  const target = resolveIn(io, dir);
  if (isOccupied(io, target)) {
    io.err(`refus : ${dir} existe et n'est pas vide ; create n'écrit jamais par-dessus un projet`);
    return CODE_REFUSED;
  }
  const code = applyPlan(io, sitePlan(dir, template, posix.basename(target)), { dryRun });
  if (code === CODE_OK) nextSteps(io, dir);
  return code;
}
