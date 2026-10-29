import type { DatavizError } from '@paulperigault/dataviz';
import { createFormatter } from '@paulperigault/dataviz';
import { unwrap } from './errors.ts';
import type { GaugeInput, GaugeModel } from './gauge-model.ts';
import { buildGaugeModel } from './gauge-model.ts';
import type { GaugeContext, GaugeLabels } from './gauge-text.ts';
import { GAUGE_LABELS, describeGauge, gaugeTable } from './gauge-text.ts';
import { buildZones } from './gauge-zones.ts';
import type { TableModel } from './table.ts';

/** Même forme que `Prepared` des courbes : le cadre commun s'en sert tel quel. */
export interface GaugePrepared {
  readonly model: GaugeModel | undefined;
  readonly empty: boolean;
  readonly renderError: DatavizError | undefined;
  readonly table: TableModel;
  /** Alternative textuelle du SVG (`<desc>`), vide sans valeur. */
  readonly description: string;
  readonly context: GaugeContext;
}

interface Presentation {
  readonly unit: string;
  readonly locale: string;
  readonly labels: Partial<GaugeLabels>;
}

/**
 * Valide à la frontière (intervalle, seuils, valeur : `gauge.*` ou `geometry.*` font échouer le
 * build avec le code) puis prépare le rendu. Sans valeur (`null`), état vide : le tableau des zones
 * reste. Aucun échec de rendu possible après validation, `renderError` est donc toujours absent.
 */
export function prepareGauge(input: GaugeInput, text: Presentation, name: string): GaugePrepared {
  const fmt = unwrap(name, createFormatter(text.locale));
  const context: GaugeContext = {
    fmt,
    unit: text.unit,
    labels: { ...GAUGE_LABELS, ...text.labels },
  };
  const base = { renderError: undefined, context };
  if (input.value === null) {
    const zones = unwrap(name, buildZones(input.zones, input.range, input.shape));
    const table = gaugeTable(zones, context, undefined);
    return { ...base, model: undefined, empty: true, table, description: '' };
  }
  const model = unwrap(name, buildGaugeModel({ ...input, value: input.value }, context));
  const { zones, reading, current } = model;
  const readout = { range: input.range, zones, value: input.value, reading, current };
  return {
    ...base,
    model,
    empty: false,
    table: gaugeTable(model.zones, context, readout),
    description: describeGauge(input.label, context, readout),
  };
}
