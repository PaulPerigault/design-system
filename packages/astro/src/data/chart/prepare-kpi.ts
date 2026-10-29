import type { KpiModel } from '@paulperigault/dataviz';
import { buildKpi, createFormatter } from '@paulperigault/dataviz';
import { unwrap } from './errors.ts';

/** Textes d'un KPI, en français par défaut. */
export interface KpiLabels {
  readonly empty: string;
}

export const KPI_LABELS: KpiLabels = { empty: 'Aucune donnée à afficher.' };

/** Variation prête à écrire : le sens en mots d'abord, le détail chiffré ensuite. */
export interface VariationView {
  readonly direction: 'up' | 'down' | 'flat';
  /** « Hausse de 4,2 % », « Stable » : le sens dit en mots, jamais par une flèche ou une teinte. */
  readonly sentence: string;
  /** Variation absolue signée (« +510 € »), absente si la phrase la dit déjà ou si stable. */
  readonly detail: string | undefined;
}

export interface KpiPrepared {
  readonly model: KpiModel | undefined;
  readonly variation: VariationView | undefined;
  readonly empty: boolean;
}

export interface KpiValues {
  readonly value: number | null;
  readonly unit: string;
  readonly reference: number | null;
  readonly locale: string;
}

const capitalize = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function viewOf(change: KpiModel['variation']): VariationView | undefined {
  if (change === null) return undefined;
  return {
    direction: change.direction,
    sentence: capitalize(change.sentence),
    detail: change.relative !== null && change.direction !== 'flat' ? change.absolute : undefined,
  };
}

/**
 * Valide à la frontière (`kpi.*`, `format.bad-locale` : le build échoue avec le code) puis prépare
 * le rendu. Sans valeur (`null`), état vide.
 */
export function prepareKpi(input: KpiValues, name: string): KpiPrepared {
  const { value, unit, reference, locale } = input;
  if (value === null) return { model: undefined, variation: undefined, empty: true };
  const fmt = unwrap(name, createFormatter(locale));
  const model = unwrap(name, buildKpi({ value, unit, reference }, fmt));
  const variation = viewOf(model.variation);
  return { model, variation, empty: false };
}
