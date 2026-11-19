// Validation du contrat à la frontière : une fois, avant tout appel au `.wasm`. Jamais de repli
// silencieux : un défaut lève une `MilestonesError` qui dit où il se trouve.
import { MAX_MILESTONES, MIN_MILESTONES } from './constants.ts';
import { MilestonesError } from './error.ts';
import { isDate, isHref, isId } from './fields.ts';
import { EMBLEM_KEYS } from './types.ts';
import type { EmblemKey, Goal, Milestone, MilestonesData, Status } from './types.ts';

type Rec = Readonly<Record<string, unknown>>;
const isRecord = (value: unknown): value is Rec => typeof value === 'object' && value !== null;
const isEmblem = (value: unknown): value is EmblemKey => EMBLEM_KEYS.some((key) => key === value);
const isStatus = (value: unknown): value is Status => value === 'achieved' || value === 'planned';

function text(source: Rec, key: string, where: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MilestonesError('invalid-label', `${where}.${key}`);
  }
  return value;
}

function optional(source: Rec, key: string, where: string): string | undefined {
  return source[key] === undefined ? undefined : text(source, key, where);
}

/** Texte facultatif dont le format est contrôlé par `ok` ; `code` dit ce qui est refusé. */
function formatted(
  source: Rec,
  key: 'date' | 'href',
  where: string,
  ok: (value: string) => boolean,
): string | undefined {
  const value = optional(source, key, where);
  if (value !== undefined && !ok(value)) {
    throw new MilestonesError(key === 'date' ? 'invalid-date' : 'invalid-href', `${where}.${key}`);
  }
  return value;
}

function core(raw: Rec, where: string): Pick<Milestone, 'id' | 'status' | 'emblem'> {
  const id = text(raw, 'id', where);
  if (!isId(id)) throw new MilestonesError('invalid-id', `${where}.id`);
  const { status, emblem } = { status: raw['status'], emblem: raw['emblem'] };
  if (!isStatus(status)) throw new MilestonesError('unknown-status', `${where}.status`);
  if (emblem === undefined) return { id, status };
  if (!isEmblem(emblem)) throw new MilestonesError('unknown-emblem', `${where}.emblem`);
  return { id, status, emblem };
}

function extras(raw: Rec, where: string): Pick<Milestone, 'group' | 'date' | 'href'> {
  const group = optional(raw, 'group', where);
  const date = formatted(raw, 'date', where, isDate);
  const href = formatted(raw, 'href', where, isHref);
  return {
    ...(group === undefined ? {} : { group }),
    ...(date === undefined ? {} : { date }),
    ...(href === undefined ? {} : { href }),
  };
}

function milestone(raw: unknown, index: number): Milestone {
  const where = `milestones[${index}]`;
  if (!isRecord(raw)) throw new MilestonesError('invalid-data', where);
  return { ...core(raw, where), label: text(raw, 'label', where), ...extras(raw, where) };
}

function goal(raw: unknown): Goal | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) throw new MilestonesError('invalid-data', 'goal');
  const href = formatted(raw, 'href', 'goal', isHref);
  return { label: text(raw, 'label', 'goal'), ...(href === undefined ? {} : { href }) };
}

function milestones(list: unknown): Milestone[] {
  if (!Array.isArray(list)) throw new MilestonesError('invalid-data', 'milestones');
  if (list.length < MIN_MILESTONES || list.length > MAX_MILESTONES) {
    throw new MilestonesError('milestone-count', String(list.length));
  }
  const valid = list.map((item: unknown, index) => milestone(item, index));
  const seen = new Set<string>();
  for (const { id } of valid) {
    if (seen.has(id)) throw new MilestonesError('duplicate-id', id);
    seen.add(id);
  }
  return valid;
}

/** Valide `input` et rend une copie propre. 1 à 24 jalons, `id` uniques, statuts, dates, liens. */
export function validateData(input: unknown): MilestonesData {
  const source = isRecord(input) ? input : {};
  const target = goal(source['goal']);
  return { milestones: milestones(source['milestones']), ...(target ? { goal: target } : {}) };
}
