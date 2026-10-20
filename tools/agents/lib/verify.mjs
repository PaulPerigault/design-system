// Vérification d’une tentative : formatage mécanique des fichiers possédés, commandes
// d’acceptation, contrôle de propriété. Dépendances injectées (`deps`).
import { acceptancePassed, runAcceptance } from './acceptance.mjs';
import { checkOwnership, ownershipFailure } from './ownership.mjs';

// Formatage mécanique (D-006) : Prettier sur les seuls fichiers possédés et touchés, avant
// l'acceptation, pour qu'une mise en forme oubliée ne coûte pas une escalade de palier.
const formatOwned = async (deps, task, worktree, env) => {
  const { filesTouched } = await checkOwnership({
    ...deps,
    cwd: worktree.path,
    baseSha: worktree.baseSha,
    files: task.files,
  });
  const owned = filesTouched.filter((file) => task.files.includes(file));
  if (owned.length === 0) return;
  const quoted = owned.map((file) => `'${file.replace(/'/g, "'\\''")}'`).join(' ');
  await deps.shell(`npx prettier --write --ignore-unknown ${quoted}`, {
    cwd: worktree.path,
    env,
    timeoutMs: deps.config.acceptanceTimeoutMs,
  });
};

export const verify = async (deps, task, worktree, env) => {
  await formatOwned(deps, task, worktree, env);
  const acceptance = await runAcceptance({
    shell: deps.shell,
    cwd: worktree.path,
    env,
    commands: task.acceptance,
    timeoutMs: deps.config.acceptanceTimeoutMs,
  });
  const ownership = await checkOwnership({
    git: deps.git,
    cwd: worktree.path,
    baseSha: worktree.baseSha,
    files: task.files,
  });
  const failed = acceptance
    .filter(({ code }) => code !== 0)
    .map(({ cmd, code }) => `${cmd} → ${code}`);
  const failure =
    ownershipFailure(ownership) ??
    (acceptancePassed(acceptance) ? null : `acceptation en échec : ${failed.join(' ; ')}`);
  return { acceptance, ownership, failure };
};
