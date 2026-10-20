// Worktree isolé par tâche : `git worktree add <racine>/<id> -b agent/<id> <base>`, SHA de base
// noté pour le contrôle de propriété. Git est injecté (`git(args, opts) → { code, stdout }`).
import { join, resolve } from 'node:path';

/** Chemin et branche du worktree d'une tâche. */
export function worktreeOf(repoRoot, worktreeRoot, id) {
  return { path: resolve(repoRoot, worktreeRoot, id), branch: `agent/${id}` };
}

const must = async (git, args, cwd) => {
  const result = await git(args, { cwd });
  if (result.code !== 0)
    throw new Error(`git ${args.join(' ')} : ${result.stderr || result.stdout}`);
  return result.stdout.trim();
};

/**
 * Crée le worktree depuis `base` (branche d'intégration du lot, sinon develop).
 * @returns {Promise<{ path: string, branch: string, baseSha: string }>}
 */
export async function createWorktree({ git, repoRoot, worktreeRoot, id, base }) {
  const { path, branch } = worktreeOf(repoRoot, worktreeRoot, id);
  const baseSha = await must(git, ['rev-parse', base], repoRoot);
  await must(git, ['worktree', 'add', path, '-b', branch, baseSha], repoRoot);
  return { path, branch, baseSha };
}

/** Supprime le worktree et sa branche (après intégration ou abandon). */
export async function removeWorktree({ git, repoRoot, worktreeRoot, id }) {
  const { path, branch } = worktreeOf(repoRoot, worktreeRoot, id);
  await git(['worktree', 'remove', '--force', path], { cwd: repoRoot });
  await git(['branch', '-D', branch], { cwd: repoRoot });
}

/** Tâches de `depends_on` absentes de l'historique de `base` (messages de commit). */
export async function missingDependencies({ git, repoRoot, base, dependsOn }) {
  if (dependsOn.length === 0) return [];
  const log = await must(git, ['log', base, '--format=%B'], repoRoot);
  return dependsOn.filter((id) => !new RegExp(`\\b${id.replace('.', '\\.')}\\b`).test(log));
}

export const runsPath = (repoRoot, runsDir, file) => join(repoRoot, runsDir, file);
