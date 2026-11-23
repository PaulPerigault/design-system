// Lecture de champs textuels d'un objet reçu, avec l'endroit du défaut dans l'erreur levée.
import { MilestonesError } from './error.ts';

export type Rec = Readonly<Record<string, unknown>>;
export const isRecord = (value: unknown): value is Rec =>
  typeof value === 'object' && value !== null;

export function text(source: Rec, key: string, where: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MilestonesError('invalid-label', `${where}.${key}`);
  }
  return value;
}

export function optional(source: Rec, key: string, where: string): string | undefined {
  return source[key] === undefined ? undefined : text(source, key, where);
}

const CODES = { date: 'invalid-date', href: 'invalid-href', code: 'invalid-code' } as const;

/** Texte facultatif dont le format est contrôlé par `ok` ; le code d'erreur suit la clé. */
export function formatted(
  source: Rec,
  key: keyof typeof CODES,
  where: string,
  ok: (value: string) => boolean,
): string | undefined {
  const value = optional(source, key, where);
  if (value !== undefined && !ok(value)) throw new MilestonesError(CODES[key], `${where}.${key}`);
  return value;
}
