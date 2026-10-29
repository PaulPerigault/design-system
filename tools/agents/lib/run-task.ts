// Exécution d'une tâche avec escalade : un palier par tentative (jamais deux fois le même), bascule
// vers `engine: claude` sur quota ou crédits épuisés, journal de routage, result.json et résumé.
import { runAttempt } from './attempt.ts';
import { executorEnv } from './env.ts';
import { tierPlan, unavailableEngine } from './routing.ts';
import {
  attemptFiles,
  finish,
  modelOf,
  outcomeOf,
  reasonOf,
  record,
  runFile,
} from './run-support.ts';
import type { Previous } from './run-support.ts';
import type { Attempt, HistoryEntry, Task, TaskResult } from './types.ts';
import type { Deps } from './deps.ts';
import { missingDependencies, removeWorktree } from './worktree.ts';

export interface RunOptions {
  escalate?: boolean;
  engine?: string | undefined;
  tier?: string | undefined;
  feedback?: string | undefined;
}

/** Tentatives successives selon `tiers` ; s'arrête à la première réussite. */
async function escalate(
  deps: Deps,
  task: Task,
  {
    tiers,
    engine: initialEngine,
    env,
    feedback,
  }: { tiers: string[]; engine: string; env: Record<string, string>; feedback: string | undefined },
): Promise<{ status: string; attempt: Attempt; history: HistoryEntry[] }> {
  let engine = initialEngine;
  // Retour de revue (`--feedback`) : transmis comme échec précédent dès la première tentative.
  let previous: Previous | null = feedback ? { failure: feedback, review: true } : null;
  const history: HistoryEntry[] = [];
  let lastAttempt: Attempt = { engine, tier: tiers[0] ?? '' };
  for (const [index, tier] of tiers.entries()) {
    const model = modelOf(deps, engine, tier);
    const files = attemptFiles(deps, task.id, index + 1);
    const attempt = await runAttempt(deps, task, {
      engine,
      tier,
      model,
      previousFailure: previous?.failure,
      env,
      files,
    });
    history.push({ tier, model, engine, outcome: outcomeOf(attempt) });
    await record(deps, task, attempt, reasonOf(previous));
    if (!attempt.failure) return { status: 'passed', attempt, history };
    if (attempt.quota) engine = 'claude';
    previous = attempt;
    lastAttempt = attempt;
    const last = index === tiers.length - 1;
    if (!last)
      await removeWorktree({ ...deps, worktreeRoot: deps.config.worktreeRoot, id: task.id });
  }
  return { status: 'failed', attempt: lastAttempt, history };
}

/** Exécute la tâche (`options` : escalade, moteur et palier imposés, retour de revue). */
export async function runTask(
  deps: Deps,
  task: Task,
  options: RunOptions = {},
): Promise<TaskResult> {
  await deps.fs.mkdir(runFile(deps, '.'), { recursive: true });
  const engine = options.engine ?? task.engine;
  const unavailable = unavailableEngine(deps, engine);
  if (unavailable) {
    const attempt = { failure: unavailable, engine, tier: task.tier };
    return finish(deps, task, { status: 'blocked', attempt, history: [] });
  }
  const missing = await missingDependencies({ ...deps, dependsOn: task.depends_on });
  if (missing.length > 0) {
    const attempt = {
      failure: `dépendances non intégrées : ${missing.join(', ')}`,
      engine: task.engine,
      tier: task.tier,
    };
    return finish(deps, task, { status: 'blocked', attempt, history: [] });
  }
  const env = executorEnv(deps.env, {
    emptyNpmrc: deps.emptyNpmrc,
    hookLog: runFile(deps, `${task.id}.hook.jsonl`),
  });
  const tier = options.tier ?? task.tier;
  const tiers = options.escalate ? tierPlan(deps.models, tier) : [tier];
  const outcome = await escalate(deps, task, { tiers, engine, env, feedback: options.feedback });
  return finish(deps, task, outcome);
}
