// Une tentative d'exécution d'une tâche à un palier donné : worktree neuf, `npm ci`, agent,
// acceptation, contrôle de propriété. Toutes les dépendances sont injectées (`deps`).
import { buildPrompt } from './prompt.ts';
import type { Attempt, Task } from './types.ts';
import type { Deps } from './deps.ts';
import { transportFailure } from './transports.ts';
import { agentArgs, runAgentInSlot, setupWorktree } from './attempt-support.ts';
import { quotaExhausted } from './stream.ts';
import { verify } from './verify.ts';

export interface AttemptFiles {
  stdoutFile: string;
  stderrFile: string;
}

export interface AttemptInput {
  engine: string;
  tier: string;
  model: string;
  previousFailure?: string | null | undefined;
  env: Record<string, string>;
  files: AttemptFiles;
}

export async function runAttempt(
  deps: Deps,
  task: Task,
  { engine, tier, model, previousFailure, env, files }: AttemptInput,
): Promise<Attempt> {
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
  const run = await runAgentInSlot(deps, { engine, cwd: worktree.path, env, args, files });
  const quota = quotaExhausted(run.stderr, run.summary.finalText);
  if (quota) deps.onQuota?.();
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
