/**
 * Déclaration d'accessibilité (RGAA 4.1) : données et contrôle de complétude (logique pure).
 * Le taux RGAA n'est pas mesuré : aucun audit RGAA manuel n'a été fait.
 */

export interface Appeal {
  /** Nom de l'autorité de recours. */
  name: string;
  /** Adresse du formulaire de saisine. */
  url: string;
}

export interface AccessibilityStatement {
  /** Référentiel évalué. */
  standard: string;
  /** État de conformité, tel qu'établi à ce jour. */
  conformity: string;
  /** Taux de conformité en pourcentage, `null` tant qu'il n'est pas mesuré. */
  rate: number | null;
  /** Date d'établissement de la déclaration (AAAA-MM-JJ). Vide tant que Paul ne l'a pas renseignée. */
  date: string;
  /** Adresse de contact pour signaler un problème. Vide tant que Paul ne l'a pas renseignée. */
  contact: string;
  /** Voie de recours. */
  appeal: Appeal;
}

/** Champs texte que Paul doit renseigner avant publication. */
export type TextField = 'standard' | 'conformity' | 'date' | 'contact';

export const STATEMENT: AccessibilityStatement = {
  standard: 'RGAA 4.1',
  conformity: 'non évalué',
  rate: null,
  date: '',
  contact: '',
  appeal: {
    name: 'Défenseur des droits',
    url: 'https://formulaire.defenseurdesdroits.fr',
  },
};

/** Libellés lisibles des champs texte, pour les messages de la page. */
export const FIELD_LABELS: Readonly<Record<TextField, string>> = {
  standard: 'référentiel',
  conformity: 'état de conformité',
  date: 'date d’établissement',
  contact: 'contact',
};

const TEXT_FIELDS: readonly TextField[] = ['standard', 'conformity', 'date', 'contact'];

const isBlank = (value: string): boolean => value.trim() === '';

/** Noms des champs texte vides, dans l'ordre de `TEXT_FIELDS`. */
export function statementProblems(statement: AccessibilityStatement): TextField[] {
  return TEXT_FIELDS.filter((field) => isBlank(statement[field]));
}
