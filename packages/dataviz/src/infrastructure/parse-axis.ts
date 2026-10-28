import type { Axis } from '../domain/dataset.ts';
import { parseIsoDate } from '../domain/iso-date.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import { isRecord, isStringArray } from './guards.ts';

const path = 'x';

function parseTimeValues(values: readonly string[]): Result<readonly string[]> {
  for (const [index, text] of values.entries()) {
    const date = parseIsoDate(text);
    if (!date.ok) return fail(date.error.code, date.error.message, `${path}.values[${index}]`);
  }
  return ok(values);
}

function parseNumberValues(values: readonly unknown[]): Result<readonly number[]> {
  const bad = values.findIndex((value) => typeof value !== 'number' || !Number.isFinite(value));
  if (bad >= 0)
    return fail('dataset.non-finite', "Valeur d'axe non finie.", `${path}.values[${bad}]`);
  return ok(values.filter((value): value is number => typeof value === 'number'));
}

const BAD_KIND = 'x.kind : category, time ou number ; valeurs du bon type.';

function parseTextAxis(kind: 'category' | 'time', label: string, values: unknown): Result<Axis> {
  if (!isStringArray(values)) return fail('dataset.bad-shape', BAD_KIND, path);
  const texts = kind === 'time' ? parseTimeValues(values) : ok(values);
  return texts.ok ? ok({ kind, label, values: texts.value }) : texts;
}

function parseNumberAxis(label: string, values: unknown): Result<Axis> {
  if (!Array.isArray(values)) return fail('dataset.bad-shape', BAD_KIND, path);
  const numbers = parseNumberValues(values);
  return numbers.ok ? ok({ kind: 'number', label, values: numbers.value }) : numbers;
}

/** Valide l'axe `x` : `category`, `time` (ISO 8601) ou `number`. */
export function parseAxis(input: unknown): Result<Axis> {
  if (!isRecord(input) || !Array.isArray(input['values'])) {
    return fail('dataset.bad-shape', 'x : objet avec `kind` et `values` attendu.', path);
  }
  const { kind, values } = input;
  const label = typeof input['label'] === 'string' ? input['label'] : '';
  if (kind === 'category' || kind === 'time') return parseTextAxis(kind, label, values);
  return kind === 'number'
    ? parseNumberAxis(label, values)
    : fail('dataset.bad-shape', BAD_KIND, path);
}
