// Lecture de `config.json` et `models.json` à la frontière : la forme est vérifiée ici, le reste du
// dispatcher ne manipule que des types connus.
import type { Models } from './types.ts';
import type { DispatchConfig } from './deps.ts';

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const text = (data: Json, key: string): string => {
  const value = data[key];
  if (typeof value !== 'string') throw new Error(`config.json : « ${key} » doit être une chaîne`);
  return value;
};

const number = (data: Json, key: string): number => {
  const value = data[key];
  if (typeof value !== 'number') throw new Error(`config.json : « ${key} » doit être un nombre`);
  return value;
};

const strings = (data: Json, key: string): string[] => {
  const value = data[key];
  if (!isStrings(value)) throw new Error(`config.json : « ${key} » doit être une liste`);
  return value;
};

function kiroOf(value: unknown): DispatchConfig['kiro'] {
  if (!isRecord(value)) return undefined;
  return {
    ...(typeof value.available === 'boolean' ? { available: value.available } : {}),
    ...(typeof value.reason === 'string' ? { reason: value.reason } : {}),
  };
}

export function toConfig(data: unknown): DispatchConfig {
  if (!isRecord(data)) throw new Error('config.json : un objet est attendu');
  const kiro = kiroOf(data.kiro);
  return {
    baseBranch: text(data, 'baseBranch'),
    worktreeRoot: text(data, 'worktreeRoot'),
    runsDir: text(data, 'runsDir'),
    routingLog: text(data, 'routingLog'),
    timeoutMs: number(data, 'timeoutMs'),
    acceptanceTimeoutMs: number(data, 'acceptanceTimeoutMs'),
    trustTools: strings(data, 'trustTools'),
    reviewTrustTools: strings(data, 'reviewTrustTools'),
    ...(kiro ? { kiro } : {}),
  };
}

function tiersOf(value: Json): Models['tiers'] {
  const tiers: Models['tiers'] = {};
  for (const [name, entry] of Object.entries(value)) {
    if (!isRecord(entry) || typeof entry.model !== 'string') {
      throw new Error();
    }
    tiers[name] = { model: entry.model };
  }
  return tiers;
}

function claudeOf({ default: byDefault, hard }: Json): Models['claude'] {
  if (typeof byDefault !== 'string' || typeof hard !== 'string') {
    throw new Error('models.json : claude.default et claude.hard sont attendus');
  }
  return { default: byDefault, hard };
}

export function toModels(data: unknown): Models {
  if (!isRecord(data) || !isRecord(data.tiers) || !isRecord(data.claude)) {
    throw new Error('models.json : tiers et claude sont attendus');
  }
  const escalation = strings(data, 'escalation');
  return { tiers: tiersOf(data.tiers), escalation, claude: claudeOf(data.claude) };
}
