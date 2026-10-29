// Résultat d'une exécution : `<id>.result.json` (machine) et `<id>.summary.md` (lisible, tiré du
// flux stream-json), dans `.agents/runs/` (ignoré par git).
import type { Attempt, Task, TaskResult } from './types.ts';

const ownershipOf = ({ ownership }: Attempt) => ({
  filesTouched: ownership?.filesTouched ?? [],
  outOfScope: ownership?.outOfScope ?? [],
});

const summaryOf = ({ summary }: Attempt) => ({
  credits: summary?.credits ?? null,
  toolCalls: (summary?.toolCalls ?? []).length,
});

/** Contenu de result.json. */
export function resultOf({
  task,
  status,
  failure,
  attempt,
}: {
  task: Pick<Task, 'id' | 'title'>;
  status: string;
  failure: string | null;
  attempt: Attempt;
}): TaskResult {
  const acceptance = (attempt.acceptance ?? []).map(({ cmd, code, durationMs }) => ({
    cmd,
    code,
    durationMs,
  }));
  return {
    id: task.id,
    title: task.title,
    status,
    failure,
    engine: attempt.engine,
    tier: attempt.tier,
    model: attempt.model,
    ...ownershipOf(attempt),
    acceptance,
    ...summaryOf(attempt),
    durationMs: attempt.durationMs ?? 0,
    worktree: attempt.worktree ?? null,
    attempts: attempt.history ?? [],
  };
}

const code = (value: number | null): string => (value === null ? 'délai' : String(value));

/** Résumé Markdown d'une exécution. */
export function summaryMarkdown(result: TaskResult, finalText: string | undefined): string {
  const acceptance = result.acceptance.map(({ cmd, code: exit }) => `- \`${cmd}\` → ${code(exit)}`);
  const attempts = result.attempts.map(
    ({ tier, model, outcome }) => `- ${tier} (${model}) : ${outcome}`,
  );
  return [
    `# ${result.id} — ${result.title}`,
    [
      `- Statut : **${result.status}**${result.failure ? ` (${result.failure})` : ''}`,
      `- Moteur : ${result.engine}, palier ${result.tier}, modèle ${result.model}`,
      `- Crédits Kiro : ${result.credits ?? 'n/d'} ; appels d’outils : ${result.toolCalls}`,
      `- Durée : ${Math.round(result.durationMs / 1000)} s ; worktree : \`${result.worktree}\``,
    ].join('\n'),
    `## Fichiers touchés\n\n${result.filesTouched.map((file) => `- \`${file}\``).join('\n') || '- aucun'}`,
    result.outOfScope.length ? `## Hors périmètre\n\n${result.outOfScope.join(', ')}` : '',
    `## Acceptation\n\n${acceptance.join('\n') || '- non lancée'}`,
    attempts.length ? `## Tentatives\n\n${attempts.join('\n')}` : '',
    `## Compte rendu de l’exécutant\n\n${finalText || '(vide)'}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
