import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

export type TimeUnit = 'day' | 'week' | 'month' | 'year';

export interface TimeTicks {
  readonly unit: TimeUnit;
  readonly step: number;
  /** Instants UTC (ms), alignés sur le calendrier : minuit, lundi, 1er du mois, 1er janvier. */
  readonly values: readonly number[];
}

const DAY = 86_400_000;
const WEEK_OFFSET = 3;
const MONTHS_PER_YEAR = 12;
const DAYS: Record<TimeUnit, number> = { day: 1, week: 7, month: 30, year: 365 };
const DAYS_PER_WEEK = DAYS.week;

const mod = (value: number, size: number): number => ((value % size) + size) % size;

interface Candidate {
  readonly unit: TimeUnit;
  readonly step: number;
  readonly approxMs: number;
}

const candidate = (unit: TimeUnit, step: number): Candidate => ({
  unit,
  step,
  approxMs: DAYS[unit] * step * DAY,
});

const TWO = 2;
const THREE = 3;
const FIVE = 5;
const SIX = 6;
const TEN = 10;

/** Du plus fin au plus large ; le dernier sert de repli. */
const CANDIDATES: readonly Candidate[] = [
  candidate('day', 1),
  candidate('day', TWO),
  candidate('week', 1),
  candidate('month', 1),
  candidate('month', THREE),
  candidate('month', SIX),
  candidate('year', 1),
  candidate('year', TWO),
  candidate('year', FIVE),
  candidate('year', TEN),
];

/** Premier repère (ms) à ou après `from`, aligné sur `unit` et sur un multiple de `step`. */
function firstTick({ unit, step }: Candidate, from: number): number {
  const date = new Date(from);
  const [year, month] = [date.getUTCFullYear(), date.getUTCMonth()];
  if (unit === 'year')
    return Date.UTC(Math.ceil((year + (from > Date.UTC(year, 0) ? 1 : 0)) / step) * step, 0);
  if (unit === 'month') {
    const index = year * MONTHS_PER_YEAR + month + (from > Date.UTC(year, month) ? 1 : 0);
    const aligned = Math.ceil(index / step) * step;
    return Date.UTC(Math.floor(aligned / MONTHS_PER_YEAR), aligned % MONTHS_PER_YEAR);
  }
  const days = Math.ceil(from / DAY);
  if (unit === 'day') return Math.ceil(days / step) * step * DAY;
  return (days + ((DAYS_PER_WEEK - mod(days + WEEK_OFFSET, DAYS_PER_WEEK)) % DAYS_PER_WEEK)) * DAY;
}

function advance({ unit, step }: Candidate, instant: number): number {
  const date = new Date(instant);
  if (unit === 'year') return Date.UTC(date.getUTCFullYear() + step, 0);
  if (unit === 'month') return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + step);
  return instant + (unit === 'week' ? DAYS_PER_WEEK : step) * DAY;
}

/**
 * Repères calendaires de [start ; end] (ms UTC), environ `target` au plus : le plus fin des
 * pas jour, semaine, mois, année qui n'en dépasse pas la cible. `scale.bad-domain` si start > end.
 */
export function timeTicks(start: number, end: number, target: number): Result<TimeTicks> {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || !(target >= 1)) {
    return fail('scale.bad-domain', 'Bornes finies, début ≤ fin et cible ≥ 1 attendus.', 'domain');
  }
  const chosen =
    CANDIDATES.find((candidate) => (end - start) / candidate.approxMs <= target) ??
    CANDIDATES[CANDIDATES.length - 1];
  if (chosen === undefined) return fail('scale.bad-domain', 'Aucun pas.', 'domain');
  const values: number[] = [];
  for (let at = firstTick(chosen, start); at <= end; at = advance(chosen, at)) values.push(at);
  return ok({ unit: chosen.unit, step: chosen.step, values });
}
