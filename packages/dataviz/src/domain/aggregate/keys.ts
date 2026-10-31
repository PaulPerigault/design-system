import { parseIsoDate } from '../iso-date.ts';
import type { Result } from '../result.ts';
import { ok } from '../result.ts';
import type { Grouping } from './spec.ts';

const YEAR_DIGITS = 4;
const PART_DIGITS = 2;
const pad = (value: number, digits: number): string => String(value).padStart(digits, '0');

/**
 * Libellé du groupe d'un axe de dates : `2026-10-28`, `2026-10` ou `2026`, lu en UTC (aucun fuseau
 * implicite). Une date moins précise que le pas prend le premier jour ou le premier mois :
 * `2026-10` par jour donne `2026-10-01`. `dataset.bad-date` si la date n'existe pas.
 */
export function timeKey(by: Exclude<Grouping, 'category'>, text: string): Result<string> {
  const parsed = parseIsoDate(text);
  if (!parsed.ok) return parsed;
  const date = new Date(parsed.value);
  const year = pad(date.getUTCFullYear(), YEAR_DIGITS);
  const month = pad(date.getUTCMonth() + 1, PART_DIGITS);
  const day = pad(date.getUTCDate(), PART_DIGITS);
  const keys = { year, month: `${year}-${month}`, day: `${year}-${month}-${day}` };
  return ok(keys[by]);
}
