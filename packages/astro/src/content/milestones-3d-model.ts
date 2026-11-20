/**
 * Modèle de Milestones3D : types des props, libellés par défaut et formatage des dates.
 * Les types reprennent le contrat de `@paulperigault/milestones-3d` (ADR-0012, décision 1), sans
 * l'importer : le composant ne dépend pas du paquet 3D, qui reste facultatif.
 */

export type MilestoneStatus = 'achieved' | 'planned';

export interface MilestoneItem {
  /** Identifiant unique, `[a-z0-9-]+`. */
  id: string;
  label: string;
  status: MilestoneStatus;
  /** Émetteur ou catégorie. */
  group?: string;
  /** `AAAA-MM` ou `AAAA-MM-JJ`. */
  date?: string;
  /** `https:` absolu ou chemin relatif. */
  href?: string;
  /** Clé d'emblème du jeu fermé du paquet 3D (`disc`, `check`, `shield`…). */
  emblem?: string;
}

export interface MilestoneGoal {
  label: string;
  href?: string;
}

/** Textes de l'interface que le composant écrit lui-même : à traduire avec la langue du site. */
export interface MilestoneLabels {
  achieved: string;
  planned: string;
  goal: string;
  /** Début du nom accessible d'un lien de jalon : « Voir : <libellé> ». */
  open: string;
  /** Nom accessible du panneau de détail. */
  panel: string;
}

export const DEFAULT_LABELS: MilestoneLabels = {
  achieved: 'Atteint',
  planned: 'Prévu',
  goal: 'Cible',
  open: 'Voir',
  panel: 'Détail du jalon',
};

export const DEFAULT_LOCALE = 'fr';

const DATE = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/;
const MONTH_OFFSET = 1;

export interface FormattedDate {
  /** Texte affiché, dans la langue demandée ; la valeur brute si elle n'est pas une date. */
  text: string;
  /** Valeur machine, seulement quand `date` est une date réelle. */
  datetime?: string;
}

/** Date `AAAA-MM[-JJ]` mise en forme par `Intl` (fuseau UTC : aucune dérive d'un jour). */
export function formatDate(date: string, locale: string): FormattedDate {
  const match = DATE.exec(date);
  if (!match) return { text: date };
  const [year, month, day] = [Number(match[1]), Number(match[2]), match[3]];
  const parsed = new Date(Date.UTC(year, month - MONTH_OFFSET, Number(day ?? MONTH_OFFSET)));
  if (parsed.getUTCMonth() !== month - MONTH_OFFSET) return { text: date };
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', timeZone: 'UTC' };
  if (day !== undefined) options.day = 'numeric';
  return { text: new Intl.DateTimeFormat(locale, options).format(parsed), datetime: date };
}

/** Sérialise les données pour un bloc `application/json` : `<` échappé, `</script>` impossible. */
export const dataBlock = (milestones: MilestoneItem[], goal?: MilestoneGoal): string =>
  JSON.stringify({ milestones, ...(goal ? { goal } : {}) }).replace(/</g, '\\u003c');
