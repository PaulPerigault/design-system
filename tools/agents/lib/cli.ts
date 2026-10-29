// Câblage des vraies dépendances pour les commandes du dispatcher (run, review, integrate, batch).
// Git est lancé sans les variables GIT_* héritées : un hook lancé dans un worktree exporte un
// GIT_DIR absolu qui ferait écrire les commandes dans le mauvais dépôt.
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { toConfig, toModels } from './config.ts';
import { coordination, mainRoot } from './coordination.ts';
import { run, runShell } from './process.ts';
import { parseTask } from './task.ts';
import type { Git, Task } from './types.ts';
import type { LeadDeps } from './deps.ts';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const cleanEnv = (env: NodeJS.ProcessEnv): Record<string, string> => {
  const kept: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && !key.startsWith('GIT_')) kept[key] = value;
  }
  return kept;
};

const git: Git = (args, { cwd } = {}) =>
  run('git', args, { cwd: cwd ?? REPO_ROOT, env: cleanEnv(process.env) });

const readJson = async (file: string): Promise<unknown> =>
  JSON.parse(await readFile(join(REPO_ROOT, file), 'utf8'));

/** Dépendances réelles du dispatcher. `base` = branche d'intégration du lot (sinon main). */
export async function realDeps({ base }: { base?: string | undefined } = {}): Promise<LeadDeps> {
  const config = toConfig(await readJson('tools/agents/config.json'));
  const models = toModels(await readJson('tools/agents/models.json'));
  // État partagé (runs, routage, places, verrous, amorces) dans le dépôt principal, même quand le
  // dispatcher tourne depuis un worktree (ds-lead).
  const stateRoot = mainRoot(REPO_ROOT, cleanEnv(process.env));
  const emptyNpmrc = join(stateRoot, config.runsDir, 'empty.npmrc');
  await mkdir(dirname(emptyNpmrc), { recursive: true });
  await writeFile(emptyNpmrc, '');
  return {
    git,
    launch: run,
    shell: runShell,
    fs: { appendFile, mkdir, writeFile },
    now: Date.now,
    env: cleanEnv(process.env),
    models,
    config: { ...config, worktreeRoot: resolve(stateRoot, config.worktreeRoot) },
    emptyNpmrc,
    repoRoot: REPO_ROOT,
    stateRoot,
    ...coordination({ sharedDir: join(stateRoot, '.agents'), shell: runShell }),
    base: base ?? config.baseBranch,
  };
}

/** Tâche lue depuis son fichier (chemin relatif à la racine du dépôt ou absolu). */
export const loadTask = async (file: string): Promise<Task> =>
  parseTask(await readFile(resolve(REPO_ROOT, file), 'utf8'));

export interface Options {
  _: string[];
  [key: string]: string | boolean | string[] | undefined;
}

/** Options `--clé valeur` et drapeaux `--clé` ; le reste en positionnels. */
export function parseOptions(argv: string[]): Options {
  const positionals: string[] = [];
  const named: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    const next = argv[i + 1];
    if (!arg.startsWith('--')) positionals.push(arg);
    else if (next === undefined || next.startsWith('--')) named[arg.slice(2)] = true;
    else {
      named[arg.slice(2)] = next;
      i += 1;
    }
  }
  return { ...named, _: positionals };
}
