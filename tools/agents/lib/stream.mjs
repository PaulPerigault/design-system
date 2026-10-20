// Lecture du flux `--output-format stream-json` de kiro-cli 2.32 (événements ACP en JSON Lines) :
// statut final, texte final, appels d'outils, crédits consommés
// (`_meta.kiro.promptTurnSummaries[].usage`, unité « credit », relevé le 2026-10-20).

const QUOTA =
  /quota|insufficient credit|out of credits|credit limit|usage limit|throttl|rate limit/i;

const parseLine = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

const kiroMeta = (update) => ({ promptTurnSummaries: [], ...update._meta?.kiro });

const creditsOf = (meta) =>
  meta.promptTurnSummaries
    .filter((summary) => summary.unit === 'credit')
    .reduce((sum, summary) => sum + Number(summary.usage), 0);

// Une mise à jour de session par type : ce qu'elle ajoute à l'état.
const UPDATES = {
  tool_call: (state, update) => state.toolCalls.push(kiroMeta(update).toolId ?? update.title),
  agent_message_chunk: (state, update) => {
    if (update.content?.type === 'text') state.text += update.content.text;
  },
};

const applyUpdate = (state, update = {}) => {
  state.credits += creditsOf(kiroMeta(update));
  UPDATES[update.sessionUpdate]?.(state, update);
};

// Un événement par type : `sessionUpdate` (contenu) et `runFinished` (statut final).
const EVENTS = {
  sessionUpdate: (state, data) => applyUpdate(state, data.update),
  runFinished: (state, data) => {
    state.status = data.status ?? 'unknown';
    state.finalText = data.finalText ?? '';
  },
};

/**
 * @param {string} jsonl contenu du flux
 * @returns {{ status: string, finalText: string, credits: number, toolCalls: string[],
 *   sessionId: string | null, events: number }}
 */
export function summarizeStream(jsonl) {
  const state = {
    status: 'unknown',
    finalText: '',
    text: '',
    credits: 0,
    toolCalls: [],
    sessionId: null,
  };
  const events = jsonl.split('\n').filter(Boolean).map(parseLine).filter(Boolean);
  for (const { type, data = {} } of events) {
    state.sessionId ??= data.sessionId ?? null;
    EVENTS[type]?.(state, data);
  }
  const { text, ...rest } = state;
  return { ...rest, finalText: rest.finalText || text, events: events.length };
}

/** Vrai si la sortie signale un quota ou des crédits épuisés (bascule vers engine claude). */
export const quotaExhausted = (...texts) => texts.some((text) => QUOTA.test(text ?? ''));
