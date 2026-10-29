// Revue d'une tâche par ds-reviewer, dans le worktree existant de la tâche (lecture seule) :
// node tools/agents/review.ts tasks/T2.02-color.md --model claude-opus-5.5
// Échec si le relecteur a modifié un fichier ; verdict dans .agents/runs/<id>.review-<modèle>.md.
import process from 'node:process';
import { kiroArgs } from './lib/agent-args.ts';
import { loadTask, parseOptions, realDeps, stringOption } from './lib/cli.ts';
import { executorEnv } from './lib/env.ts';
import { buildPrompt } from './lib/prompt.ts';
import { runAgent } from './lib/transports.ts';
import { verdictOf } from './lib/verdict.ts';
import type { Verdict } from './lib/verdict.ts';
import { runsPath, worktreeOf } from './lib/worktree.ts';

const ARGV_START = 2;
const options = parseOptions(process.argv.slice(ARGV_START));
const [taskFile] = options._;
if (!taskFile) {
  console.error('Usage : node tools/agents/review.ts <tâche.md> [--model <modèle>]');
  process.exit(2);
}
const task = await loadTask(taskFile);
const deps = await realDeps();
if (deps.config.kiro?.available === false) {
  console.error(`Kiro ${deps.config.kiro.reason} : rien n'est lancé.`);
  process.exit(2);
}
const model = stringOption(options, 'model') ?? deps.models.tiers.hard?.model ?? 'claude-opus-5.5';
const { path } = worktreeOf(deps.repoRoot, deps.config.worktreeRoot, task.id);
const status = async (): Promise<string> =>
  (await deps.git(['status', '--porcelain'], { cwd: path })).stdout;

const before = await status();
const file = (suffix: string): string =>
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
const readable: Verdict = run.code === 0 ? verdictOf(verdict) : 'unreadable';
const outcome: Verdict | 'touched' = touched ? 'touched' : readable;
const LABELS: Record<Verdict | 'touched', string> = {
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
process.exit(outcome === 'approved' ? 0 : 1);
