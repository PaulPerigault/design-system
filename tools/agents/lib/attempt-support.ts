// Aides d'une tentative : arguments du moteur, worktree et installation, session sous une place.
import { claudeArgs, kiroArgs } from './agent-args.ts';
import type { AttemptFiles } from './attempt.ts';
import type { Deps, DispatchConfig, WorktreeInfo } from './deps.ts';
import { runAgent } from './transports.ts';
import type { Models, Task } from './types.ts';
import { createWorktree } from './worktree.ts';

const SETUP = 'npm ci --prefer-offline --no-audit --no-fund --ignore-scripts';

export const agentArgs = ({
  engine,
  task,
  model,
  prompt,
  config,
  models,
}: {
  engine: string;
  task: Task;
  model: string;
  prompt: string;
  config: DispatchConfig;
  models: Models;
}): string[] =>
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

export const setupWorktree = async (
  deps: Deps,
  task: Task,
  env: Record<string, string>,
): Promise<{ worktree: WorktreeInfo; setupFailure: string | null }> => {
  const { git, shell, repoRoot, config } = deps;
  const worktree = await createWorktree({
    git,
    repoRoot,
    worktreeRoot: config.worktreeRoot,
    id: task.id,
    base: deps.base,
  });
  // Amorce clonée si `deps.install` existe (seed.mjs), sinon `npm ci` classique.
  const opts = { cwd: worktree.path, env, timeoutMs: config.acceptanceTimeoutMs };
  const setup = deps.install ? await deps.install(opts) : await shell(SETUP, opts);
  return {
    worktree,
    setupFailure: setup.code === 0 ? null : `npm ci en échec : ${setup.stderr.slice(-500)}`,
  };
};

/** Session d'agent sous une place du sémaphore global (`deps.slot`, locks.mjs), toujours rendue. */
export const runAgentInSlot = async (
  deps: Deps,
  {
    engine,
    cwd,
    env,
    args,
    files,
  }: {
    engine: string;
    cwd: string;
    env: Record<string, string>;
    args: string[];
    files: AttemptFiles;
  },
) => {
  const release = deps.slot ? await deps.slot() : null;
  const timeoutMs = deps.config.timeoutMs;
  return runAgent({ launch: deps.launch, engine, cwd, env, timeoutMs, args, ...files }).finally(
    () => release?.(),
  );
};
