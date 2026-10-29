import { parseAccentHue } from './hue.ts';
import { parseFontStack } from './font-stack.ts';
import type { Result } from './result.ts';
import { ok } from './result.ts';

/** Entrées validées : une entrée absente garde la valeur par défaut des sources DTCG. */
export interface BuildInput {
  readonly accentHue?: number;
  readonly fontStack?: string;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null;

/**
 * Entrées brutes `{ accentHue?, fontStack? }` → entrées validées. Pas d'entrée, ou clé absente :
 * défaut. Clé présente mais vide ou `undefined` : erreur (teinte absente, pile vide).
 */
export function parseBuildInput(raw: unknown): Result<BuildInput> {
  if (!isRecord(raw)) return ok({});
  const result: { accentHue?: number; fontStack?: string } = {};
  if (Object.hasOwn(raw, 'accentHue')) {
    const hue = parseAccentHue(raw['accentHue']);
    if (!hue.ok) return hue;
    result.accentHue = hue.value;
  }
  if (Object.hasOwn(raw, 'fontStack')) {
    const stack = parseFontStack(raw['fontStack']);
    if (!stack.ok) return stack;
    result.fontStack = stack.value;
  }
  return ok(result);
}
