import type { AggregateSpec } from '../domain/aggregate/spec.ts';
import type { Dataset } from '../domain/dataset.ts';
import type { Result } from '../domain/result.ts';

/** Formatage d'affichage ; l'adaptateur `Intl` vit en infrastructure. */
export interface Formatter {
  readonly locale: string;
  /** « 1 234,5 € » : séparateurs de la locale, unité après une espace insécable. */
  number(value: number, unit?: string): string;
  /** Libellé d'une donnée manquante, dit et non omis. */
  readonly missing: string;
  /** Date en toutes lettres : « 28 octobre 2026 ». */
  dateLabel(iso: string): string;
}

/**
 * Agrégation d'un jeu de données par catégorie ou par pas de temps (D-098). Implémentée d'abord en
 * TypeScript (`createAggregator`, la référence), plus tard par l'adaptateur WebAssembly (ADR-0007).
 */
export interface Aggregator {
  aggregate(dataset: Dataset, spec: AggregateSpec): Result<Dataset>;
}
