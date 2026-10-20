import { posix } from 'node:path';
import { resolveIn } from '../lib/io.mjs';
import { applyPlan } from '../lib/plan.mjs';
import { sitePackageJson } from '../site/package-json.mjs';
import { outputPath } from '../site/template.mjs';

const CODE_OK = 0;
const CODE_REFUSED = 1;
const CODE_USAGE = 2;
const USAGE = 'usage : create <dossier> [--dry-run]';

/**
 * Vrai si `abs` existe et n'est pas un dossier vide (un fichier compte comme occupé).
 * @param {import('../lib/io.mjs').CreateIo} io
 * @param {string} abs
 * @returns {boolean}
 */
function isOccupied(io, abs) {
  if (!io.exists(abs)) return false;
  try {
    return io.readdir(abs).length > 0;
  } catch {
    return true;
  }
}

/**
 * Plan d'écriture : `package.json` généré puis fichiers du gabarit, `_` → `.`.
 * @param {string} dir dossier cible, tel que saisi
 * @param {import('../site/template.mjs').SiteTemplate} template
 * @param {string} name dernier segment du dossier résolu
 * @returns {import('../lib/plan.mjs').PlanEntry[]}
 */
function sitePlan(dir, template, name) {
  const files = [
    { path: 'package.json', content: sitePackageJson(name, template.versions) },
    ...template.files.map(({ path, content }) => ({ path: outputPath(path), content })),
  ];
  return files
    .sort((a, b) => (a.path < b.path ? -1 : Number(a.path > b.path)))
    .map(({ path, content }) => ({ path: posix.join(dir, path), content }));
}

/**
 * @param {import('../lib/io.mjs').CreateIo} io
 * @param {string} dir
 */
function nextSteps(io, dir) {
  io.out('');
  io.out('Prochaines étapes :');
  for (const step of [`cd ${dir}`, 'git init', 'npm install', 'npm run dev', 'npm run verify']) {
    io.out(`  ${step}`);
  }
  io.out('Commitez package-lock.json avant la première CI (npm ci l’exige).');
}

/**
 * `create <dossier>` : site Astro minimal consommateur du design system.
 * Ne génère jamais dans un dossier non vide, même avec `--force`.
 * @param {{ positionals?: string[], dryRun?: boolean }} options
 * @param {{ io: import('../lib/io.mjs').CreateIo,
 *   template: import('../site/template.mjs').SiteTemplate }} ctx
 * @returns {number} code de sortie
 */
export function run({ positionals = [], dryRun = false }, { io, template }) {
  if (positionals.length !== 1) {
    io.err(USAGE);
    return CODE_USAGE;
  }
  const [dir] = positionals;
  const target = resolveIn(io, dir);
  if (isOccupied(io, target)) {
    io.err(`refus : ${dir} existe et n'est pas vide ; create n'écrit jamais par-dessus un projet`);
    return CODE_REFUSED;
  }
  const code = applyPlan(io, sitePlan(dir, template, posix.basename(target)), { dryRun });
  if (code === CODE_OK) nextSteps(io, dir);
  return code;
}
