import type { Dataset } from '@paulperigault/dataviz';

/** Propriétés communes des graphiques SVG statiques. */
export interface ChartProps {
  /** Préfixe unique des ids du titre et de la description : lettres, chiffres et tirets. */
  id: string;
  /** Titre du graphique, premier élément de son nom accessible. */
  title: string;
  /** Jeu de données (`schema: 1`) : validé, sinon le build échoue avec le code d'erreur. */
  dataset: Dataset;
  /** Locale des nombres et des dates. Défaut : `fr`. */
  locale?: string;
  /** Libellé du tableau de données lié. */
  tableLabel?: string;
  /** Message de l'état vide (aucune valeur présente). */
  emptyLabel?: string;
  /** Début du message d'erreur de rendu ; le code d'erreur le suit. */
  errorLabel?: string;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
}

/** Libellés par défaut, en français. */
export const DEFAULT_LABELS = {
  table: 'Données du graphique',
  empty: 'Aucune donnée à afficher.',
  error: 'Le graphique ne peut pas être dessiné',
} as const;

const ID_PATTERN = /^[A-Za-z][\w-]*$/;

/** Refuse un `id` qui ne forme pas un identifiant HTML sûr pour `aria-labelledby`. */
export function assertChartId(id: unknown, component: string): void {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new TypeError(`${component} : id attendu, sans espace (lettres, chiffres et tirets).`);
  }
}
