// Lecture du flux `--output-format stream-json` de kiro-cli 2.32 (événements ACP en JSON Lines) :
// statut final, texte final, appels d'outils, crédits consommés
// (`_meta.kiro.promptTurnSummaries[].usage`, unité « credit », relevé le 2026-10-20).
import type { StreamSummary } from './types.ts';

const QUOTA =
  /quota|insufficient credit|out of credits|credit limit|usage limit|throttl|rate limit/i;

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

interface State {
  status: string;
  finalText: string;
  text: string;
  credits: number;
  toolCalls: string[];
  sessionId: string | null;
}

const parseLine = (line: string): Json | null => {
  try {
    const value: unknown = JSON.parse(line);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
};

const summariesOf = (update: Json): Json[] => {
  const meta = isRecord(update._meta) ? update._meta : {};
  const kiro = isRecord(meta.kiro) ? meta.kiro : {};
  return Array.isArray(kiro.promptTurnSummaries) ? kiro.promptTurnSummaries.filter(isRecord) : [];
};

const toolIdOf = (update: Json): string => {
  const meta = isRecord(update._meta) ? update._meta : {};
  const kiro = isRecord(meta.kiro) ? meta.kiro : {};
  return String(kiro.toolId ?? update.title);
};

const creditsOf = (update: Json): number =>
  summariesOf(update)
    .filter((summary) => summary.unit === 'credit')
    .reduce((sum, summary) => sum + Number(summary.usage), 0);

// Une mise à jour de session par type : ce qu'elle ajoute à l'état.
const UPDATES: Record<string, (state: State, update: Json) => void> = {
  tool_call: (state, update) => void state.toolCalls.push(toolIdOf(update)),
  agent_message_chunk: (state, update) => {
    const { content } = update;
    if (isRecord(content) && content.type === 'text') state.text += String(content.text);
  },
};

const applyUpdate = (state: State, update: Json): void => {
  state.credits += creditsOf(update);
  const kind = update.sessionUpdate;
  if (typeof kind === 'string') UPDATES[kind]?.(state, update);
};

// Un événement par type : `sessionUpdate` (contenu) et `runFinished` (statut final).
const EVENTS: Record<string, (state: State, data: Json) => void> = {
  sessionUpdate: (state, data) => applyUpdate(state, isRecord(data.update) ? data.update : {}),
  runFinished: (state, data) => {
    state.status = typeof data.status === 'string' ? data.status : 'unknown';
    state.finalText = typeof data.finalText === 'string' ? data.finalText : '';
  },
};

/** `jsonl` : contenu du flux. */
export function summarizeStream(jsonl: string): StreamSummary {
  const state: State = {
    status: 'unknown',
    finalText: '',
    text: '',
    credits: 0,
    toolCalls: [],
    sessionId: null,
  };
  const events = jsonl
    .split('\n')
    .filter(Boolean)
    .map(parseLine)
    .filter((event): event is Json => event !== null);
  for (const { type, data } of events) {
    const payload = isRecord(data) ? data : {};
    state.sessionId ??= typeof payload.sessionId === 'string' ? payload.sessionId : null;
    if (typeof type === 'string') EVENTS[type]?.(state, payload);
  }
  const { text, finalText, ...rest } = state;
  return { ...rest, finalText: finalText || text, events: events.length };
}

/** Vrai si la sortie signale un quota ou des crédits épuisés (bascule vers engine claude). */
export const quotaExhausted = (...texts: (string | undefined | null)[]): boolean =>
  texts.some((text) => QUOTA.test(text ?? ''));
