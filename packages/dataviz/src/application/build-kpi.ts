import { checkReadable } from '../domain/kpi/readable.ts';
import { variation } from '../domain/kpi/variation.ts';
import type { VariationText } from '../domain/kpi/words.ts';
import { variationText } from '../domain/kpi/words.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';
import type { Formatter } from './ports.ts';

export interface KpiInput {
  readonly value: number;
  readonly unit?: string;
  /** Valeur de comparaison (période précédente, objectif) ; absente ou `null` : pas de variation. */
  readonly reference?: number | null;
}

export interface KpiModel {
  readonly value: number;
  readonly unit: string;
  /** Valeur formatée avec son unité : « 12 345 € ». */
  readonly valueText: string;
  readonly variation: VariationText | null;
  /** Lecture à voix haute : « 12 345 €, hausse de 4,2 % ». */
  readonly summary: string;
}

/**
 * Modèle d'un KPI : valeur, unité, variation (absolue et relative, sens). Le formateur porte la
 * locale (`createFormatter(locale)`), donc le rendu ne dépend jamais de la locale du build.
 * Erreurs : `kpi.bad-value`, `kpi.bad-reference`, `kpi.unreadable`, `format.bad-locale`.
 */
export function buildKpi(input: KpiInput, formatter: Formatter): Result<KpiModel> {
  const { value, unit = '', reference = null } = input;
  const readable = checkReadable(value);
  if (!readable.ok) return readable;
  const change = variation(value, reference);
  if (!change.ok) return change;
  const valueText = formatter.number(value, unit);
  if (change.value === null) {
    return ok({ value, unit, valueText, variation: null, summary: valueText });
  }
  const delta = checkReadable(change.value.absolute, 'variation');
  if (!delta.ok) return fail('kpi.unreadable', delta.error.message, 'variation');
  const text = variationText(change.value, unit, formatter);
  if (!text.ok) return text;
  return ok({
    value,
    unit,
    valueText,
    variation: text.value,
    summary: `${valueText}, ${text.value.sentence}`,
  });
}
