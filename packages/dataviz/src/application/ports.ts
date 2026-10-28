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

/** Réduction ou agrégation d'un jeu de données (implémentation Rust plus tard, ADR-0007). */
export interface Aggregator {
  aggregate(dataset: Dataset, spec: Readonly<Record<string, unknown>>): Result<Dataset>;
}
