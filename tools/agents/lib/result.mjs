// Résultat d'une exécution : `<id>.result.json` (machine) et `<id>.summary.md` (lisible, tiré du
// flux stream-json), dans `.agents/runs/` (ignoré par git).

/**
 * @param {{ task: object, status: string, failure: string | null, attempt: object }} input
 * @returns {object} contenu de result.json
 */
export function resultOf({ task, status, failure, attempt }) {
  const full = { acceptance: [], history: [], durationMs: 0, worktree: null, ...attempt };
  const ownership = { filesTouched: [], outOfScope: [], ...full.ownership };
  const summary = { credits: null, toolCalls: [], ...full.summary };
  return {
    id: task.id,
    title: task.title,
    status,
    failure,
    engine: full.engine,
    tier: full.tier,
    model: full.model,
    filesTouched: ownership.filesTouched,
    outOfScope: ownership.outOfScope,
    acceptance: full.acceptance.map(({ cmd, code, durationMs }) => ({ cmd, code, durationMs })),
    credits: summary.credits,
    toolCalls: summary.toolCalls.length,
    durationMs: full.durationMs,
    worktree: full.worktree,
    attempts: full.history,
  };
}

const code = (value) => (value === null ? 'délai' : String(value));

/** Résumé Markdown d'une exécution. */
export function summaryMarkdown(result, finalText) {
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
