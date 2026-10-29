// Aides de l'exécution d'une tâche : modèle d'un palier, journal de routage, result.json et résumé.
import type { AttemptFiles } from './attempt.ts';
import type { Deps } from './deps.ts';
import { modelFor, routingEntry } from './routing.ts';
import { resultOf, summaryMarkdown } from './result.ts';
import type { Attempt, HistoryEntry, Task, TaskResult } from './types.ts';
import { runsPath } from './worktree.ts';

export interface Previous {
  failure?: string | null | undefined;
  review?: boolean;
}

export const outcomeOf = (attempt: Attempt): string =>
  attempt.failure ? `échec : ${attempt.failure}` : 'réussite';

export const claudeModel = (deps: Deps, tier: string): string =>
  tier === 'hard' ? deps.models.claude.hard : deps.models.claude.default;
export const modelOf = (deps: Deps, engine: string, tier: string): string =>
  engine === 'kiro' ? modelFor(deps.models, tier) : claudeModel(deps, tier);
export const stateRoot = (deps: Deps): string => deps.stateRoot ?? deps.repoRoot;
export const runFile = (deps: Deps, file: string): string =>
  runsPath(stateRoot(deps), deps.config.runsDir, file);

export const record = async (
  deps: Deps,
  task: Task,
  attempt: Attempt,
  reason: string,
): Promise<void> => {
  const entry = routingEntry({
    task,
    ...attempt,
    reason,
    result: outcomeOf(attempt),
    credits: attempt.summary?.credits,
    now: new Date(deps.now()),
  });
  await deps.fs.appendFile(
    runsPath(stateRoot(deps), '.', deps.config.routingLog),
    `${JSON.stringify(entry)}\n`,
  );
};

export const finish = async (
  deps: Deps,
  task: Task,
  { status, attempt, history }: { status: string; attempt: Attempt; history: HistoryEntry[] },
): Promise<TaskResult> => {
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

export const attemptFiles = (deps: Deps, id: string, n: number): AttemptFiles => ({
  stdoutFile: runFile(deps, `${id}.a${n}.jsonl`),
  stderrFile: runFile(deps, `${id}.a${n}.stderr.log`),
});

export const reasonOf = (previous: Previous | null): string => {
  if (!previous) return 'palier initial';
  return previous.review ? 'relance après revue' : `escalade après : ${previous.failure}`;
};
