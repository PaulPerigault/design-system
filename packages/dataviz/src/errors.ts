import { PALETTE_ERROR_CODES } from '@paulperigault/tokens/palette';

/** Erreurs typées du paquet : union fermée à champ `code`, aucune erreur anonyme. */
export const ERROR_CODES = [
  'dataset.empty',
  'dataset.bad-shape',
  'dataset.length-mismatch',
  'dataset.non-finite',
  'dataset.duplicate-id',
  'dataset.bad-date',
  'dataset.unit-mismatch',
  'dataset.too-many-points',
  'chart.too-many-series',
  'bar.too-many-categories',
  'stack.negative-value',
  'gauge.bad-range',
  'gauge.bad-thresholds',
  'scale.bad-domain',
  'scale.bad-range',
  'geometry.bad-input',
  'downsample.bad-target',
  'format.bad-locale',
  'kpi.bad-value',
  'kpi.bad-reference',
  'kpi.unreadable',
  'sparkline.no-data',
  'sparkline.bad-size',
  'sparkline.too-many-gaps',
  ...PALETTE_ERROR_CODES,
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface DatavizError {
  readonly code: ErrorCode;
  readonly message: string;
  /** Chemin de la valeur fautive (`series[1].values[3]`), vide si global. */
  readonly path: string;
}

export const error = (code: ErrorCode, message: string, path = ''): DatavizError => ({
  code,
  message,
  path,
});
