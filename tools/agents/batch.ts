// Lance les tâches prêtes d'un lot, au plus N en parallèle :
// node tools/agents/batch.ts --lot L3 --base lot/L3 [--parallel 3] [--escalate]
// Une tâche est prête quand toutes ses dépendances sont intégrées (citées dans l'historique de la
// branche du lot). Commencer à --parallel 3 ; ne monter que sans erreur de quota.
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import process from 'node:process';
import { batchTable, mapLimit, readyTasks, tasksOfLot } from './lib/batch.ts';
import { loadTask, parseOptions, realDeps, stringOption } from './lib/cli.ts';
import { baselineCommands, failingBaseline } from './lib/preflight.ts';
import { runTask } from './lib/run-task.ts';

const ARGV_START = 2;
const DEFAULT_PARALLEL = 3;
const options = parseOptions(process.argv.slice(ARGV_START));
const lot = stringOption(options, 'lot');
if (!lot) {
  console.error('Usage : node tools/agents/batch.ts --lot L3 [--base lot/L3] [--parallel 3]');
  process.exit(2);
}

const deps = await realDeps({ base: stringOption(options, 'base') });
const files = (await readdir(`${deps.repoRoot}/tasks`)).filter((name) =>
  /^T\d+\.\d+.*\.md$/.test(name),
);
const tasks = tasksOfLot(await Promise.all(files.map((name) => loadTask(`tasks/${name}`))), lot);
const log = (await deps.git(['log', deps.base, '--format=%B'])).stdout;
const integrated = tasks
  .filter((task) => new RegExp(`\\b${task.id.replace('.', '\\.')}\\b`).test(log))
  .map((task) => task.id);
const { ready, waiting } = readyTasks(tasks, integrated);

// D-015 : base verte avant de lancer quoi que ce soit (sauf --skip-preflight).
if (ready.length > 0 && options['skip-preflight'] !== true) {
  const commands = baselineCommands(ready, (path) => existsSync(`${deps.repoRoot}/${path}`));
  const failures = await failingBaseline(
    {
      shell: deps.shell,
      cwd: deps.repoRoot,
      env: deps.env,
      timeoutMs: deps.config.acceptanceTimeoutMs,
      lock: deps.heavyLock,
    },
    commands,
  );
  if (failures.length > 0) {
    for (const { cmd, code, tail } of failures)
      console.error(`Base rouge : \`${cmd}\` → ${code}\n${tail}`);
    console.error('Lot non lancé : corriger la base (D-015).');
    process.exit(1);
  }
}

const parallel = Number(stringOption(options, 'parallel') ?? DEFAULT_PARALLEL);
const results = await mapLimit(ready, parallel, (task) =>
  runTask(deps, task, { escalate: options.escalate === true }),
);
console.log(batchTable(results, waiting));
process.exit(results.every((result) => result.status === 'passed') ? 0 : 1);
