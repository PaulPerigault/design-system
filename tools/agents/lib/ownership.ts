// Contrôle de propriété : l'exécutant n'a touché que les fichiers de `files:`. On compare au SHA
// de base noté à la création du worktree : fichiers modifiés ou supprimés, fichiers non suivis
// (créés), et `HEAD == base` (un commit de l'exécutant est un échec).
import type { Git, Ownership } from './types.ts';

const lines = (text: string): string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export async function checkOwnership({
  git,
  cwd,
  baseSha,
  files,
}: {
  git: Git;
  cwd: string;
  baseSha: string;
  files: string[];
}): Promise<Ownership> {
  const head = (await git(['rev-parse', 'HEAD'], { cwd })).stdout.trim();
  const changed = (await git(['diff', '--name-only', '--no-renames', baseSha], { cwd })).stdout;
  const created = (await git(['ls-files', '--others', '--exclude-standard'], { cwd })).stdout;
  const filesTouched = [...new Set([...lines(changed), ...lines(created)])].sort();
  const allowed = new Set(files);
  return {
    filesTouched,
    outOfScope: filesTouched.filter((file) => !allowed.has(file)),
    committed: head !== baseSha,
  };
}

/** Raison d'échec du contrôle de propriété, ou null s'il passe. */
export function ownershipFailure({
  outOfScope,
  committed,
  filesTouched,
}: Ownership): string | null {
  if (committed) return 'l’exécutant a commité (HEAD ≠ base)';
  if (outOfScope.length > 0) return `fichiers hors périmètre : ${outOfScope.join(', ')}`;
  if (filesTouched.length === 0) return 'aucun fichier modifié';
  return null;
}
