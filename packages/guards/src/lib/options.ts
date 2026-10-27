// Lecture typée des options d'un contrôle : la forme est vérifiée ici, à la frontière
// (configuration JSON, drapeaux de ligne de commande), avant d'entrer dans la logique pure.
import { GuardUsageError } from './report.ts';

export type Options = Record<string, unknown>;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/** Liste de chaînes ; `fallback` si l'option est absente. Une liste vide est conservée. */
export function listOption(options: Options, key: string, fallback: string[]): string[] {
  const value = options[key];
  if (value === undefined) return fallback;
  if (isStrings(value)) return value;
  throw new GuardUsageError(`${key} doit être une liste de chaînes`);
}

/** Comme `listOption`, mais une liste vide donne aussi `fallback`. */
export function nonEmptyListOption(options: Options, key: string, fallback: string[]): string[] {
  const list = listOption(options, key, fallback);
  return list.length > 0 ? list : fallback;
}
