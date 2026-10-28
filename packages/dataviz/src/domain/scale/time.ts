import { parseIsoDate } from '../iso-date.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { Extent, LinearScale } from './linear.ts';
import { linearScale } from './linear.ts';

/** Domaine temporel en ms UTC : premier et dernier instant des dates ISO 8601 données. */
export function timeDomain(values: readonly string[]): Result<Extent> {
  if (values.length === 0) return fail('scale.bad-domain', 'Aucune date.', 'values');
  const instants: number[] = [];
  for (const [index, text] of values.entries()) {
    const parsed = parseIsoDate(text);
    if (!parsed.ok) return fail('dataset.bad-date', parsed.error.message, `values[${index}]`);
    instants.push(parsed.value);
  }
  return ok([Math.min(...instants), Math.max(...instants)]);
}

/** Échelle temporelle : instants UTC (ms) vers l'étendue ; le temps est linéaire en ms. */
export const timeScale = (domain: Extent, range: Extent): Result<LinearScale> =>
  linearScale(domain, range);
