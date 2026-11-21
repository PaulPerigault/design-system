// Validation du contrat à la frontière : une fois, avant tout appel au `.wasm`. Jamais de repli
// silencieux : un défaut lève une `MilestonesError` qui dit où il se trouve. Le tri par date n'est
// pas fait ici : l'ordre donné est conservé (le composant Astro trie).
import { MAX_MILESTONES, MIN_MILESTONES } from './constants.ts';
import { MilestonesError } from './error.ts';
import { isCode, isDate, isHref, isId } from './fields.ts';
import type { Goal, Milestone, MilestonesData, Status } from './types.ts';
import { badgeOf } from './validate-badge.ts';
import { formatted, isRecord, optional, text } from './validate-text.ts';
import type { Rec } from './validate-text.ts';

const isStatus = (value: unknown): value is Status => value === 'achieved' || value === 'planned';

function core(raw: Rec, where: string): Pick<Milestone, 'id' | 'status'> {
  const id = text(raw, 'id', where);
  if (!isId(id)) throw new MilestonesError('invalid-id', `${where}.id`);
  const status = raw['status'];
  if (!isStatus(status)) throw new MilestonesError('unknown-status', `${where}.status`);
  return { id, status };
}

/** Champs facultatifs, copiés seulement s'ils sont présents. */
function extras(raw: Rec, status: Status, where: string): Partial<Milestone> {
  const group = optional(raw, 'group', where);
  const date = formatted(raw, 'date', where, isDate);
  const code = formatted(raw, 'code', where, isCode);
  const badge = badgeOf(raw, status, where);
  const href = formatted(raw, 'href', where, isHref);
  return {
    ...(group === undefined ? {} : { group }),
    ...(date === undefined ? {} : { date }),
    ...(code === undefined ? {} : { code }),
    ...(badge === undefined ? {} : { badge }),
    ...(href === undefined ? {} : { href }),
  };
}

function milestone(raw: unknown, index: number): Milestone {
  const where = `milestones[${index}]`;
  if (!isRecord(raw)) throw new MilestonesError('invalid-data', where);
  const { id, status } = core(raw, where);
  return { id, label: text(raw, 'label', where), status, ...extras(raw, status, where) };
}

function goal(raw: unknown): Goal | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) throw new MilestonesError('invalid-data', 'goal');
  if (raw['badge'] !== undefined) throw new MilestonesError('invalid-badge', 'goal.badge');
  const date = formatted(raw, 'date', 'goal', isDate);
  const href = formatted(raw, 'href', 'goal', isHref);
  return {
    label: text(raw, 'label', 'goal'),
    ...(date === undefined ? {} : { date }),
    ...(href === undefined ? {} : { href }),
  };
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

/**
 * Valide `input` et rend une copie propre, dans l'ordre fourni. 1 à 24 jalons, `id` uniques,
 * statuts, dates, codes, badges (achieved seulement), liens.
 */
export function validateData(input: unknown): MilestonesData {
  const source = isRecord(input) ? input : {};
  const target = goal(source['goal']);
  return { milestones: milestones(source['milestones']), ...(target ? { goal: target } : {}) };
}
