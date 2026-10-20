// Une tentative d'exécution d'une tâche à un palier donné : worktree neuf, `npm ci`, agent,
// acceptation, contrôle de propriété. Toutes les dépendances sont injectées (`deps`).
import { buildPrompt } from './prompt.mjs';
import { claudeArgs, kiroArgs, runAgent, transportFailure } from './transports.mjs';
import { quotaExhausted } from './stream.mjs';
import { verify } from './verify.mjs';
import { createWorktree } from './worktree.mjs';

const SETUP = 'npm ci --prefer-offline --no-audit --no-fund --ignore-scripts';

const agentArgs = ({ engine, task, model, prompt, config, models }) =>
  engine === 'kiro'
    ? kiroArgs({
        agent: task.agent,
        model,
        effort: task.effort,
        prompt,
        trustTools: task.agent === 'ds-reviewer' ? config.reviewTrustTools : config.trustTools,
      })
    : claudeArgs({
        model: task.tier === 'hard' ? models.claude.hard : models.claude.default,
        prompt,
        readOnly: task.agent === 'ds-reviewer',
      });

const setupWorktree = async (deps, task, env) => {
  const { git, shell, repoRoot, config } = deps;
  const worktree = await createWorktree({
    git,
    repoRoot,
    worktreeRoot: config.worktreeRoot,
    id: task.id,
    base: deps.base,
  });
  const setup = await shell(SETUP, {
    cwd: worktree.path,
    env,
    timeoutMs: config.acceptanceTimeoutMs,
  });
  return {
    worktree,
    setupFailure: setup.code === 0 ? null : `npm ci en échec : ${setup.stderr.slice(-500)}`,
  };
};

/**
 * @returns {Promise<{ engine, tier, model, worktree, summary, acceptance, ownership,
 *   failure: string | null, quota: boolean, durationMs: number }>}
 */
export async function runAttempt(deps, task, { engine, tier, model, previousFailure, env, files }) {
  const start = deps.now();
  const base = { engine, tier, model };
  const { worktree, setupFailure } = await setupWorktree(deps, task, env);
  if (setupFailure)
    return {
      ...base,
      worktree: worktree.path,
      failure: setupFailure,
      quota: false,
      durationMs: deps.now() - start,
    };
  const prompt = buildPrompt(task, {
    previousFailure,
    role: task.agent === 'ds-reviewer' ? 'reviewer' : 'worker',
  });
  const args = agentArgs({ engine, task, model, prompt, config: deps.config, models: deps.models });
  const run = await runAgent({
    launch: deps.launch,
    engine,
    cwd: worktree.path,
    env,
    timeoutMs: deps.config.timeoutMs,
    args,
    ...files,
  });
  const quota = quotaExhausted(run.stderr, run.summary.finalText);
  const transport = transportFailure(run);
  const checked = transport
    ? { acceptance: [], ownership: null, failure: transport }
    : await verify(deps, task, worktree, env);
  return {
    ...base,
    worktree: worktree.path,
    summary: run.summary,
    ...checked,
    quota,
    durationMs: deps.now() - start,
  };
}
