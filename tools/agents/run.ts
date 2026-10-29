// Exécute une tâche : node tools/agents/run.ts tasks/T1.01-stack.md
//   [--base lot/L1] [--escalate] [--engine kiro|claude] [--tier std] [--feedback revue.md]
// Écrit .agents/runs/<id>.result.json et <id>.summary.md ; code 0 si la tâche passe.
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { loadTask, parseOptions, realDeps, stringOption } from './lib/cli.ts';
import { runTask } from './lib/run-task.ts';

const ARGV_START = 2;
const options = parseOptions(process.argv.slice(ARGV_START));
const [file] = options._;
if (!file) {
  console.error('Usage : node tools/agents/run.ts <tâche.md> [--base <branche>] [--escalate]');
  process.exit(2);
}

const task = await loadTask(file);
const deps = await realDeps({ base: stringOption(options, 'base') });
const feedbackFile = stringOption(options, 'feedback');
const result = await runTask(deps, task, {
  escalate: options.escalate === true,
  feedback: feedbackFile ? await readFile(feedbackFile, 'utf8') : undefined,
  engine: stringOption(options, 'engine'),
  tier: stringOption(options, 'tier'),
});
console.log(
  `${result.id} ${result.status} · ${result.engine}/${result.model} · crédits ${result.credits ?? 'n/d'} · ${result.failure ?? 'ok'}`,
);
process.exit(result.status === 'passed' ? 0 : 1);
