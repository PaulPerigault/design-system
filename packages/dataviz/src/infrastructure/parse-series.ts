import type { Series } from '../domain/dataset.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import { isRecord } from './guards.ts';

function parseValues(values: readonly unknown[], path: string): Result<(number | null)[]> {
  const parsed: (number | null)[] = [];
  for (const [index, value] of values.entries()) {
    if (value === null) parsed.push(null);
    else if (typeof value === 'number' && Number.isFinite(value)) parsed.push(value);
    else
      return fail('dataset.non-finite', 'Nombre fini ou null attendu.', `${path}.values[${index}]`);
  }
  return ok(parsed);
}

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/** Valide une série : `id`, `label`, `unit` (texte) et `values` (nombres finis ou `null`). */
export function parseSeries(input: unknown, index: number): Result<Series> {
  const path = `series[${index}]`;
  if (!isRecord(input) || !Array.isArray(input['values'])) {
    return fail('dataset.bad-shape', 'Série : objet avec `values` attendu.', path);
  }
  const id = text(input['id'], '');
  if (id === '')
    return fail('dataset.bad-shape', 'Série : `id` texte non vide attendu.', `${path}.id`);
  const parsed = parseValues(input['values'], path);
  if (!parsed.ok) return parsed;
  return ok({
    id,
    label: text(input['label'], id),
    unit: text(input['unit'], ''),
    values: parsed.value,
  });
}
