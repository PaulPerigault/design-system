import type { Result } from './result.ts';
import { fail, ok } from './result.ts';

const PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?Z)?)?)?$/;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;

const part = (text: string | undefined, fallback: number): number =>
  text === undefined ? fallback : Number(text);

/** Instant UTC (ms depuis l'époque) d'une date ISO 8601 ; `dataset.bad-date` sinon. */
export function parseIsoDate(text: string): Result<number> {
  const match = PATTERN.exec(text);
  if (!match) return fail('dataset.bad-date', `« ${text} » n'est pas une date ISO 8601 UTC.`);
  const [year, month, day, hour, minute, second] = [
    part(match[1], 0),
    part(match[2], 1),
    part(match[3], 1),
    part(match[4], 0),
    part(match[5], 0),
    part(match[6], 0),
  ];
  const ms = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(ms);
  const exact =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    hour <= MAX_HOUR &&
    minute <= MAX_MINUTE &&
    second <= MAX_MINUTE;
  return exact ? ok(ms) : fail('dataset.bad-date', `« ${text} » n'existe pas au calendrier.`);
}
