import { readFileSync } from 'node:fs';

interface RolePair {
  bg: string;
  min: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Paires `fg`/`bg` de `roles.json` pour un rôle : validées à la lecture, sans assertion de type. */
export function readRolePairs(role: string): RolePair[] {
  const url = new URL('../../src/roles.json', import.meta.url);
  const data: unknown = JSON.parse(readFileSync(url, 'utf8'));
  const pairs = isRecord(data) && Array.isArray(data['pairs']) ? data['pairs'] : [];
  return pairs.flatMap((pair) =>
    isRecord(pair) && pair['fg'] === role && typeof pair['bg'] === 'string'
      ? [{ bg: pair['bg'], min: Number(pair['min']) }]
      : [],
  );
}
