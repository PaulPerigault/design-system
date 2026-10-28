/** Contrat de données (ADR-0007) : colonnaire, versionné, valeurs manquantes à `null`. */
export const DATASET_SCHEMA = 1;
export const MAX_POINTS = 100_000;
export const MAX_SERIES = 6;

export interface CategoryAxis {
  readonly kind: 'category';
  readonly label: string;
  readonly values: readonly string[];
}

/** Dates ISO 8601 lues en UTC : `2026-10`, `2026-10-28`, `2026-10-28T09:00:00Z`. */
export interface TimeAxis {
  readonly kind: 'time';
  readonly label: string;
  readonly values: readonly string[];
}

export interface NumberAxis {
  readonly kind: 'number';
  readonly label: string;
  readonly values: readonly number[];
}

export type Axis = CategoryAxis | TimeAxis | NumberAxis;

export interface Series {
  readonly id: string;
  readonly label: string;
  /** Une unité par série (`€`, `%`, `ms`), vide si sans unité. */
  readonly unit: string;
  /** `null` = donnée manquante, jamais `0` ni `NaN`. */
  readonly values: readonly (number | null)[];
}

export interface Dataset {
  readonly schema: typeof DATASET_SCHEMA;
  readonly x: Axis;
  readonly series: readonly Series[];
}
