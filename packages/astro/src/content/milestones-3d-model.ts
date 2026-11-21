/**
 * Modèle de Milestones3D : types des props, libellés par défaut et formatage des dates.
 * Les types reprennent le contrat de `@paulperigault/milestones-3d` (ADR-0013, décision 1), sans
 * l'importer : le composant ne dépend pas du paquet 3D, qui reste facultatif.
 */

export type MilestoneStatus = 'achieved' | 'planned';

export interface MilestoneBadge {
  /** Chemin relatif ou `https:` : image du même site, fournie et autorisée par le consommateur. */
  src: string;
  width?: number;
  height?: number;
}

export interface MilestoneItem {
  /** Identifiant unique, `[a-z0-9-]+`. */
  id: string;
  label: string;
  status: MilestoneStatus;
  /** Émetteur ou catégorie. */
  group?: string;
  /** `AAAA-MM` ou `AAAA-MM-JJ`, obtenue ou prévue. */
  date?: string;
  /** Code court lisible (par exemple un code d'examen). */
  code?: string;
  /** Badge d'un jalon obtenu, affiché tel quel. Jamais pour un jalon prévu. */
  badge?: MilestoneBadge;
  /** Lien de vérification : `https:` absolu ou chemin relatif. */
  href?: string;
  /** Texte du panneau de détail (texte simple, jamais envoyé à la scène). */
  description?: string;
}

export interface MilestoneGoal {
  label: string;
  date?: string;
  href?: string;
  description?: string;
}

/** Textes de l'interface que le composant écrit lui-même : à traduire avec la langue du site. */
export interface MilestoneLabels {
  achieved: string;
  planned: string;
  goal: string;
  /** Texte du lien de vérification ; le nom accessible y ajoute le libellé du jalon. */
  verify: string;
  /** Lien d'évitement de la section. */
  skip: string;
  previous: string;
  next: string;
  /** Nom du repère d'étapes (la liste devenue indicateur). */
  steps: string;
  /** Position dans le parcours, avec `{current}` et `{total}`. */
  progress: string;
  /** Nom accessible du panneau de détail. */
  panel: string;
}

export const DEFAULT_LABELS: MilestoneLabels = {
  achieved: 'Obtenu',
  planned: 'Prévu',
  goal: 'Objectif',
  verify: 'Vérifier sur Credly',
  skip: 'Passer cette section',
  previous: 'Précédent',
  next: 'Suivant',
  steps: 'Étapes du parcours',
  progress: 'Étape {current} sur {total}',
  panel: 'Détail du jalon',
};

export const DEFAULT_LOCALE = 'fr';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const MONTH_OFFSET = 1;

export interface FormattedDate {
  /** Texte affiché, dans la langue demandée ; la valeur brute si elle n'est pas une date. */
  text: string;
  /** Forme courte (mois abrégé et année), pour les étiquettes de la scène. */
  short: string;
  /** Valeur machine, seulement quand `date` est une date réelle. */
  datetime?: string;
}

/** Date `AAAA-MM[-JJ]` mise en forme par `Intl` (fuseau UTC : aucune dérive d'un jour). */
export function formatDate(date: string, locale: string): FormattedDate {
  const match = DATE.exec(date);
  if (!match) return { text: date, short: date };
  const [year, month, day] = [Number(match[1]), Number(match[2]), match[3]];
  const parsed = new Date(Date.UTC(year, month - MONTH_OFFSET, Number(day ?? MONTH_OFFSET)));
  if (parsed.getUTCMonth() !== month - MONTH_OFFSET) return { text: date, short: date };
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', timeZone: 'UTC' };
  if (day !== undefined) options.day = 'numeric';
  const short = new Intl.DateTimeFormat(locale, { ...options, month: 'short', day: undefined });
  return {
    text: new Intl.DateTimeFormat(locale, options).format(parsed),
    short: short.format(parsed),
    datetime: date,
  };
}
