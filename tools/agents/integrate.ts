// Intégration d'une tâche réussie et relue dans la branche courante (branche du lot) :
// node tools/agents/integrate.ts tasks/T1.01-stack.md "feat(astro): primitive stack"
// Commit (par l'orchestrateur, hooks actifs) des seuls fichiers de `files:` dans le worktree,
// cherry-pick dans la branche courante, puis suppression du worktree et de sa branche.
import process from 'node:process';
import { loadTask, parseOptions, realDeps } from './lib/cli.ts';
import { checkOwnership, ownershipFailure } from './lib/ownership.ts';
import { must, removeWorktree, worktreeOf } from './lib/worktree.ts';

const ARGV_START = 2;
const options = parseOptions(process.argv.slice(ARGV_START));
const [file, subject] = options._;
if (!file || !subject) {
  console.error('Usage : node tools/agents/integrate.ts <tâche.md> "<type(scope): sujet>"');
  process.exit(2);
}

const task = await loadTask(file);
const deps = await realDeps();
const { path, branch } = worktreeOf(deps.repoRoot, deps.config.worktreeRoot, task.id);

const baseSha = await must(deps.git, ['rev-parse', 'HEAD'], path);
const ownership = await checkOwnership({ git: deps.git, cwd: path, baseSha, files: task.files });
const failure = ownershipFailure(ownership);
if (failure) throw new Error(`Intégration refusée (${task.id}) : ${failure}`);

await must(deps.git, ['add', '--', ...ownership.filesTouched], path);
await must(deps.git, ['commit', '-m', subject, '-m', `Tâche ${task.id} : ${task.title}.`], path);
await must(deps.git, ['cherry-pick', branch], deps.repoRoot);
await removeWorktree({
  git: deps.git,
  repoRoot: deps.repoRoot,
  worktreeRoot: deps.config.worktreeRoot,
  id: task.id,
});
console.log(`${task.id} intégrée : ${ownership.filesTouched.length} fichier(s), « ${subject} »`);
