import type { Result } from './result.ts';
import { fail, ok } from './result.ts';

export const MIN_HUE = 0;
export const MAX_HUE = 360;

const isBlank = (raw: unknown): boolean =>
  raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');

/**
 * Teinte d'accent en degrés OKLCH, dans [0, 360]. Accepte un nombre ou son écriture décimale
 * (argument de ligne de commande) ; une valeur vide ou absente est refusée.
 */
export function parseAccentHue(raw: unknown): Result<number> {
  if (isBlank(raw)) return fail('build.hue-missing', '--pp-accent-hue : teinte absente.');
  const hue = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof hue !== 'number' || !Number.isFinite(hue)) {
    return fail('build.hue-not-finite', `--pp-accent-hue : « ${String(raw)} » n'est pas fini.`);
  }
  if (hue < MIN_HUE || hue > MAX_HUE) {
    return fail(
      'build.hue-out-of-range',
      `--pp-accent-hue : ${hue} hors de ${MIN_HUE} à ${MAX_HUE} degrés.`,
    );
  }
  return ok(hue);
}
