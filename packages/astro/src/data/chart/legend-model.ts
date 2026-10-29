import type { DatavizError } from '@paulperigault/dataviz';
import { MAX_SERIES } from '@paulperigault/dataviz';
import { ChartError } from './errors.ts';
import { barSwatch } from './bar-patterns.ts';
import type { Swatch } from './swatch.ts';
import { lineSwatch } from './swatch.ts';

const fault = (code: DatavizError['code'], message: string): DatavizError => ({
  code,
  message,
  path: 'items',
});

export type LegendKind = 'line' | 'bar';

/**
 * Échantillons d'une légende autonome : un trait et un marqueur, ou un carré de motif, par rang.
 * Aucun libellé ou plus de 6 entrées : `ChartError` (le build échoue avec le code).
 */
export function legendSwatches(
  id: string,
  items: readonly string[],
  kind: LegendKind,
  name: string,
): Swatch[] {
  if (items.length === 0 || items.some((label) => label.trim() === '')) {
    throw new ChartError(name, fault('dataset.bad-shape', 'Chaque entrée porte un libellé.'));
  }
  if (items.length > MAX_SERIES) {
    const message = `${items.length} entrées ; ${MAX_SERIES} au plus.`;
    throw new ChartError(name, fault('chart.too-many-series', message));
  }
  return items.map((label, index) =>
    kind === 'bar' ? barSwatch(id, index, label) : lineSwatch(index, label),
  );
}
