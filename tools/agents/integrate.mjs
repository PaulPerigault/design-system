// Intégration d'une tâche réussie et relue dans la branche courante (branche du lot) :
// node tools/agents/integrate.mjs tasks/T1.01-stack.md "feat(astro): primitive stack"
// Commit (par l'orchestrateur, hooks actifs) des seuls fichiers de `files:` dans le worktree,
// cherry-pick dans la branche courante, puis suppression du worktree et de sa branche.
import { loadTask, parseOptions, realDeps } from './lib/cli.ts';
import { checkOwnership, ownershipFailure } from './lib/ownership.ts';
import { removeWorktree, worktreeOf } from './lib/worktree.ts';

const options = parseOptions(process.argv.slice(2));
const [file, subject] = options._;
if (!file || !subject) {
  console.error('Usage : node tools/agents/integrate.mjs <tâche.md> "<type(scope): sujet>"');
  process.exit(2);
}

const task = await loadTask(file);
const deps = await realDeps();
const { path, branch } = worktreeOf(deps.repoRoot, deps.config.worktreeRoot, task.id);
const must = async (args, cwd) => {
  const result = await deps.git(args, { cwd });
  if (result.code !== 0)
    throw new Error(`git ${args.join(' ')} : ${result.stderr || result.stdout}`);
  return result.stdout.trim();
};

const baseSha = await must(['rev-parse', 'HEAD'], path);
const ownership = await checkOwnership({ git: deps.git, cwd: path, baseSha, files: task.files });
const failure = ownershipFailure(ownership);
if (failure) throw new Error(`Intégration refusée (${task.id}) : ${failure}`);

await must(['add', '--', ...ownership.filesTouched], path);
await must(['commit', '-m', subject, '-m', `Tâche ${task.id} : ${task.title}.`], path);
await must(['cherry-pick', branch], deps.repoRoot);
await removeWorktree({
  git: deps.git,
  repoRoot: deps.repoRoot,
  worktreeRoot: deps.config.worktreeRoot,
  id: task.id,
});
console.log(`${task.id} intégrée : ${ownership.filesTouched.length} fichier(s), « ${subject} »`);
