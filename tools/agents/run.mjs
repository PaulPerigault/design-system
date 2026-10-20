// Exécute une tâche : node tools/agents/run.mjs tasks/T1.01-stack.md
//   [--base lot/L1] [--escalate] [--engine kiro|claude] [--tier std] [--feedback revue.md]
// Écrit .agents/runs/<id>.result.json et <id>.summary.md ; code 0 si la tâche passe.
import { readFile } from 'node:fs/promises';
import { loadTask, parseOptions, realDeps } from './lib/cli.mjs';
import { runTask } from './lib/run-task.mjs';

const options = parseOptions(process.argv.slice(2));
const [file] = options._;
if (!file) {
  console.error('Usage : node tools/agents/run.mjs <tâche.md> [--base <branche>] [--escalate]');
  process.exit(2);
}

const task = await loadTask(file);
const deps = await realDeps({ base: options.base });
const result = await runTask(deps, task, {
  escalate: options.escalate === true,
  feedback: options.feedback ? await readFile(options.feedback, 'utf8') : undefined,
  engine: options.engine,
  tier: options.tier,
});
console.log(
  `${result.id} ${result.status} · ${result.engine}/${result.model} · crédits ${result.credits ?? 'n/d'} · ${result.failure ?? 'ok'}`,
);
process.exit(result.status === 'passed' ? 0 : 1);
