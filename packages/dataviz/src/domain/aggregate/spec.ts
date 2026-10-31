import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';

export const OPERATIONS = ['sum', 'mean', 'min', 'max', 'count', 'first', 'last'] as const;
export type Operation = (typeof OPERATIONS)[number];

/** `category` : une catégorie par texte distinct ; les autres : un groupe par jour, mois ou année UTC. */
export const GROUPINGS = ['category', 'day', 'month', 'year'] as const;
export type Grouping = (typeof GROUPINGS)[number];

export interface AggregateSpec {
  readonly by: Grouping;
  readonly operation: Operation;
}

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  list.some((item) => item === value);

const field = (spec: unknown, key: string): unknown =>
  typeof spec === 'object' && spec !== null ? Reflect.get(spec, key) : undefined;

/** `aggregate.bad-spec` si `by` ou `operation` n'est pas dans la liste (appel venu de JavaScript). */
export function checkSpec(spec: unknown): Result<AggregateSpec> {
  const by = field(spec, 'by');
  const operation = field(spec, 'operation');
  if (!isOneOf(GROUPINGS, by)) {
    return fail('aggregate.bad-spec', `by : ${GROUPINGS.join(', ')} attendu.`, 'by');
  }
  if (!isOneOf(OPERATIONS, operation)) {
    return fail('aggregate.bad-spec', `operation : ${OPERATIONS.join(', ')} attendu.`, 'operation');
  }
  return ok({ by, operation });
}
