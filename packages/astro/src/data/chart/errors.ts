import type { DatavizError, ErrorCode } from '@paulperigault/dataviz';

/** Erreur de build d'un graphique : porte le code typé de `@paulperigault/dataviz`. */
export class ChartError extends Error {
  readonly code: ErrorCode;
  readonly path: string;

  constructor(chart: string, source: DatavizError) {
    const where = source.path === '' ? '' : ` (${source.path})`;
    super(`${chart} : [${source.code}] ${source.message}${where}`);
    this.name = 'ChartError';
    this.code = source.code;
    this.path = source.path;
  }
}
