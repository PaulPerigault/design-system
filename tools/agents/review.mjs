// Revue d'une tâche par ds-reviewer, dans le worktree existant de la tâche (lecture seule) :
// node tools/agents/review.mjs tasks/T2.02-color.md --model claude-opus-5.5
// Échec si le relecteur a modifié un fichier ; verdict dans .agents/runs/<id>.review-<modèle>.md.
import { executorEnv } from './lib/env.ts';
import { loadTask, parseOptions, realDeps } from './lib/cli.ts';
import { buildPrompt } from './lib/prompt.ts';
import { runAgent } from './lib/transports.ts';
import { kiroArgs } from './lib/agent-args.ts';
import { verdictOf } from './lib/verdict.ts';
import { runsPath, worktreeOf } from './lib/worktree.ts';

const options = parseOptions(process.argv.slice(2));
const task = await loadTask(options._[0]);
const deps = await realDeps();
if (deps.config.kiro?.available === false) {
  console.error(`Kiro ${deps.config.kiro.reason} : rien n'est lancé.`);
  process.exit(2);
}
const model = options.model ?? deps.models.tiers.hard.model;
const { path } = worktreeOf(deps.repoRoot, deps.config.worktreeRoot, task.id);
const status = async () => (await deps.git(['status', '--porcelain'], { cwd: path })).stdout;

const before = await status();
const file = (suffix) =>
  runsPath(deps.stateRoot, deps.config.runsDir, `${task.id}.review-${model}${suffix}`);
const release = await deps.slot();
const run = await runAgent({
  launch: deps.launch,
  engine: 'kiro',
  cwd: path,
  env: executorEnv(deps.env, { emptyNpmrc: deps.emptyNpmrc }),
  timeoutMs: deps.config.timeoutMs,
  stdoutFile: file('.jsonl'),
  stderrFile: file('.stderr.log'),
  args: kiroArgs({
    agent: 'ds-reviewer',
    model,
    effort: 'high',
    trustTools: deps.config.reviewTrustTools,
    prompt: buildPrompt(
      {
        ...task,
        body: `${task.body}\n\nRelis le diff du worktree (git diff, fichiers non suivis).`,
      },
      { role: 'reviewer' },
    ),
  }),
}).finally(() => release());
const touched = (await status()) !== before;
const verdict = run.summary.finalText.trim();
const outcome = touched ? 'touched' : run.code === 0 ? verdictOf(verdict) : 'unreadable';
const approved = outcome === 'approved';
const LABELS = {
  approved: 'APPROUVÉ',
  changes: 'CHANGEMENTS REQUIS',
  unreadable: 'VERDICT ILLISIBLE',
  touched: 'RELECTEUR A MODIFIÉ UN FICHIER',
};
await deps.fs.writeFile(
  file('.md'),
  `# Revue ${task.id} (${model})\n\nCrédits : ${run.summary.credits}\n\n${verdict}\n`,
);
console.log(`${task.id} revue ${model} : ${LABELS[outcome]} · crédits ${run.summary.credits}`);
process.exit(approved ? 0 : 1);
