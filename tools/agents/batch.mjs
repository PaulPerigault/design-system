// Lance les tâches prêtes d'un lot, au plus N en parallèle :
// node tools/agents/batch.mjs --lot L3 --base lot/L3 [--parallel 3] [--escalate]
// Une tâche est prête quand toutes ses dépendances sont intégrées (citées dans l'historique de la
// branche du lot). Commencer à --parallel 3 ; ne monter que sans erreur de quota.
import { readdir } from 'node:fs/promises';
import { batchTable, mapLimit, readyTasks, tasksOfLot } from './lib/batch.mjs';
import { loadTask, parseOptions, realDeps } from './lib/cli.mjs';
import { runTask } from './lib/run-task.mjs';

const DEFAULT_PARALLEL = 3;
const options = parseOptions(process.argv.slice(2));
if (!options.lot) {
  console.error('Usage : node tools/agents/batch.mjs --lot L3 [--base lot/L3] [--parallel 3]');
  process.exit(2);
}

const deps = await realDeps({ base: options.base });
const files = (await readdir(`${deps.repoRoot}/tasks`)).filter((name) =>
  /^T\d+\.\d+.*\.md$/.test(name),
);
const tasks = tasksOfLot(
  await Promise.all(files.map((name) => loadTask(`tasks/${name}`))),
  options.lot,
);
const log = (await deps.git(['log', deps.base, '--format=%B'])).stdout;
const integrated = tasks
  .filter((task) => new RegExp(`\\b${task.id.replace('.', '\\.')}\\b`).test(log))
  .map((task) => task.id);
const { ready, waiting } = readyTasks(tasks, integrated);

const parallel = Number(options.parallel ?? DEFAULT_PARALLEL);
const results = await mapLimit(ready, parallel, (task) =>
  runTask(deps, task, { escalate: options.escalate === true }),
);
console.log(batchTable(results, waiting));
process.exit(results.every((result) => result.status === 'passed') ? 0 : 1);
