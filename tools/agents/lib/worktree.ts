// Worktree isolé par tâche : `git worktree add <racine>/<id> -b agent/<id> <base>`, SHA de base
// noté pour le contrôle de propriété. Git est injecté (`git(args, opts) → { code, stdout }`).
import { posix, resolve } from 'node:path';
import type { Git } from './types.ts';

/** Chemin et branche du worktree d'une tâche. */
export function worktreeOf(repoRoot: string, worktreeRoot: string, id: string) {
  return { path: resolve(repoRoot, worktreeRoot, id), branch: `agent/${id}` };
}

export const must = async (git: Git, args: string[], cwd: string): Promise<string> => {
  const result = await git(args, { cwd });
  if (result.code !== 0)
    throw new Error(`git ${args.join(' ')} : ${result.stderr || result.stdout}`);
  return result.stdout.trim();
};

interface WorktreeInput {
  git: Git;
  repoRoot: string;
  worktreeRoot: string;
  id: string;
}

/** Crée le worktree depuis `base` (branche d'intégration du lot, sinon main). */
export async function createWorktree({
  git,
  repoRoot,
  worktreeRoot,
  id,
  base,
}: WorktreeInput & { base: string }): Promise<{ path: string; branch: string; baseSha: string }> {
  const { path, branch } = worktreeOf(repoRoot, worktreeRoot, id);
  const baseSha = await must(git, ['rev-parse', base], repoRoot);
  await must(git, ['worktree', 'add', path, '-b', branch, baseSha], repoRoot);
  return { path, branch, baseSha };
}

/** Supprime le worktree et sa branche (après intégration ou abandon). */
export async function removeWorktree({ git, repoRoot, worktreeRoot, id }: WorktreeInput) {
  const { path, branch } = worktreeOf(repoRoot, worktreeRoot, id);
  await git(['worktree', 'remove', '--force', path], { cwd: repoRoot });
  await git(['branch', '-D', branch], { cwd: repoRoot });
}

/** Tâches de `depends_on` absentes de l'historique de `base` (messages de commit). */
export async function missingDependencies({
  git,
  repoRoot,
  base,
  dependsOn,
}: {
  git: Git;
  repoRoot: string;
  base: string;
  dependsOn: string[];
}): Promise<string[]> {
  if (dependsOn.length === 0) return [];
  const log = await must(git, ['log', base, '--format=%B'], repoRoot);
  return dependsOn.filter((id) => !new RegExp(`\\b${id.replace('.', '\\.')}\\b`).test(log));
}

export const runsPath = (repoRoot: string, runsDir: string, file: string): string =>
  posix.join(repoRoot, runsDir, file);
