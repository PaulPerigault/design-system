// Exécution d'une tâche avec escalade : un palier par tentative (jamais deux fois le même), bascule
// vers `engine: claude` sur quota ou crédits épuisés, journal de routage, result.json et résumé.
import { runAttempt } from './attempt.mjs';
import { executorEnv } from './env.mjs';
import { resultOf, summaryMarkdown } from './result.mjs';
import { modelFor, routingEntry, tierPlan } from './routing.mjs';
import { missingDependencies, removeWorktree, runsPath } from './worktree.mjs';

const outcomeOf = (attempt) => (attempt.failure ? `échec : ${attempt.failure}` : 'réussite');

const claudeModel = (deps, tier) =>
  tier === 'hard' ? deps.models.claude.hard : deps.models.claude.default;
const modelOf = (deps, engine, tier) =>
  engine === 'kiro' ? modelFor(deps.models, tier) : claudeModel(deps, tier);
const runFile = (deps, file) => runsPath(deps.repoRoot, deps.config.runsDir, file);

const record = async (deps, task, attempt, reason) => {
  const entry = routingEntry({
    task,
    ...attempt,
    reason,
    result: outcomeOf(attempt),
    credits: attempt.summary?.credits,
    now: new Date(deps.now()),
  });
  await deps.fs.appendFile(
    runsPath(deps.repoRoot, '.', deps.config.routingLog),
    `${JSON.stringify(entry)}\n`,
  );
};

const finish = async (deps, task, { status, attempt, history }) => {
  const failure = attempt.failure ?? null;
  const result = resultOf({ task, status, failure, attempt: { ...attempt, history } });
  await deps.fs.writeFile(
    runFile(deps, `${task.id}.result.json`),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  const finalText = attempt.summary?.finalText;
  await deps.fs.writeFile(
    runFile(deps, `${task.id}.summary.md`),
    `${summaryMarkdown(result, finalText)}\n`,
  );
  return result;
};

const attemptFiles = (deps, id, n) => ({
  stdoutFile: runFile(deps, `${id}.a${n}.jsonl`),
  stderrFile: runFile(deps, `${id}.a${n}.stderr.log`),
});

/** Tentatives successives selon `tiers` ; s'arrête à la première réussite. */
async function escalate(deps, task, { tiers, engine: initialEngine, env }) {
  let engine = initialEngine;
  let previous = null;
  const history = [];
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
    await record(
      deps,
      task,
      attempt,
      previous ? `escalade après : ${previous.failure}` : 'palier initial',
    );
    if (!attempt.failure) return { status: 'passed', attempt, history };
    if (attempt.quota) engine = 'claude';
    previous = attempt;
    const last = index === tiers.length - 1;
    if (!last)
      await removeWorktree({ ...deps, worktreeRoot: deps.config.worktreeRoot, id: task.id });
  }
  return { status: 'failed', attempt: previous, history };
}

/**
 * @param {object} deps dépendances injectées (git, launch, shell, fs, now, env, models, config…)
 * @param {object} task tâche lue par parseTask
 * @param {{ escalate?: boolean, engine?: string, tier?: string }} [options]
 */
export async function runTask(deps, task, options = {}) {
  await deps.fs.mkdir(runFile(deps, '.'), { recursive: true });
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
  const outcome = await escalate(deps, task, { tiers, engine: options.engine ?? task.engine, env });
  return finish(deps, task, outcome);
}
