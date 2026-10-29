// Moteur de ds-lead, à lancer détaché :
//   nohup node tools/agents/lead.mjs >> .agents/lead.log 2>&1 &
// Prend le premier lot « à faire » ou « renvoyé » de `.agents/lead-queue.md`, le marque « en
// cours », lance une session ds-lead, puis enchaîne. Après une session sans « prêt pour
// validation », le lot est retenté une fois, puis « abandonné » (repris par l'orchestrateur).
// S'arrête proprement quand la file est vide. Écrit son pid dans `.agents/lead.pid`.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { realDeps } from './lib/cli.ts';
import {
  nextLot,
  parseQueue,
  serializeQueue,
  statusAfterSession,
  updateLot,
} from './lib/lead-queue.ts';
import { commitLeadFiles, prepareLeadWorktree, runLeadSession } from './lib/lead-session.ts';

const deps = await realDeps();
if (deps.config.kiro?.available === false) {
  console.error(`Kiro ${deps.config.kiro.reason} : rien n'est lancé.`);
  process.exit(2);
}
const shared = join(deps.stateRoot, '.agents');
const queueFile = join(shared, 'lead-queue.md');
const pidFile = join(shared, 'lead.pid');
const log = (message) => console.log(`${new Date().toISOString()} ${message}`);
const readQueue = () => parseQueue(readFileSync(queueFile, 'utf8'));
const writeQueue = (queue) => writeFileSync(queueFile, serializeQueue(queue));

const setStatus = (id, changes) => {
  const queue = updateLot(readQueue(), id, changes);
  writeQueue(queue);
  return queue.lots.find((lot) => lot.id === id);
};

async function runLot(lot) {
  const attempts = lot.attempts + 1;
  setStatus(lot.id, { status: 'en cours', attempts });
  log(`${lot.id} : session ${attempts} (base ${lot.base})`);
  try {
    const cwd = await prepareLeadWorktree(deps, lot);
    const run = await runLeadSession(deps, { lot, cwd, queueFile, attempt: attempts });
    log(
      `${lot.id} : session terminée (code ${run.code}, ${run.summary.credits.toFixed(2)} crédits, ${run.summary.toolCalls.length} outils)`,
    );
    const committed = await commitLeadFiles(deps, { cwd, lot });
    log(`${lot.id} : ${committed.length} fichier(s) de tâche ou de bilan commités`);
  } catch (error) {
    log(`${lot.id} : erreur ${error.message}`);
  }
  const after = readQueue().lots.find((item) => item.id === lot.id);
  const status = statusAfterSession({ ...after, attempts });
  setStatus(lot.id, { status });
  log(`${lot.id} : ${status}`);
}

writeFileSync(pidFile, String(process.pid));
try {
  for (let lot = nextLot(readQueue()); lot; lot = nextLot(readQueue())) await runLot(lot);
  log('file vide : arrêt de ds-lead.');
} finally {
  rmSync(pidFile, { force: true });
}
