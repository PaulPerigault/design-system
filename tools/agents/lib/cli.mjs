// Câblage des vraies dépendances pour les commandes du dispatcher (run, review, integrate, batch).
// Git est lancé sans les variables GIT_* héritées : un hook lancé dans un worktree exporte un
// GIT_DIR absolu qui ferait écrire les commandes dans le mauvais dépôt.
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, runShell } from './process.mjs';
import { parseTask } from './task.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const cleanEnv = (env) =>
  Object.fromEntries(Object.entries(env).filter(([key]) => !key.startsWith('GIT_')));

const git = (args, { cwd } = {}) =>
  run('git', args, { cwd: cwd ?? REPO_ROOT, env: cleanEnv(process.env) });

const readJson = async (file) => JSON.parse(await readFile(join(REPO_ROOT, file), 'utf8'));

/** Dépendances réelles du dispatcher. `base` = branche d'intégration du lot (sinon develop). */
export async function realDeps({ base } = {}) {
  const config = await readJson('tools/agents/config.json');
  const models = await readJson('tools/agents/models.json');
  const emptyNpmrc = join(REPO_ROOT, config.runsDir, 'empty.npmrc');
  await mkdir(dirname(emptyNpmrc), { recursive: true });
  await writeFile(emptyNpmrc, '');
  return {
    git,
    launch: run,
    shell: runShell,
    fs: { appendFile, mkdir, writeFile, readFile },
    now: Date.now,
    env: cleanEnv(process.env),
    models,
    config,
    emptyNpmrc,
    repoRoot: REPO_ROOT,
    base: base ?? config.baseBranch,
  };
}

/** Tâche lue depuis son fichier (chemin relatif à la racine du dépôt ou absolu). */
export const loadTask = async (file) => parseTask(await readFile(resolve(REPO_ROOT, file), 'utf8'));

/** Options `--clé valeur` et drapeaux `--clé` ; le reste en positionnels. */
export function parseOptions(argv) {
  const options = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) options._.push(arg);
    else if (argv[i + 1] === undefined || argv[i + 1].startsWith('--'))
      options[arg.slice(2)] = true;
    else options[arg.slice(2)] = argv[(i += 1)];
  }
  return options;
}
