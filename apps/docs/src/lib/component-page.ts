/** Gabarit des pages de composant : types, ordre des sections et validation (logique pure). */

export interface EvidenceLink {
  label: string;
  href?: string;
}

export interface A11yNotes {
  keyboard: string[];
  screenReader: string[];
  guaranteed: string[];
  integrator: string[];
}

export interface ComponentPageData {
  /** Nom de l'élément du registre. */
  slug: string;
  title: string;
  /** Une phrase : à quoi sert le composant. */
  summary: string;
  use: string[];
  avoid: string[];
  /** Code copiable affiché sous les exemples. */
  snippet: string;
  a11y: A11yNotes;
  evidence: EvidenceLink[];
}

export interface Section {
  id: string;
  title: string;
}

/** Source unique de l'ordre des sections, réutilisée par le sommaire de la page. */
export const SECTIONS: readonly Section[] = [
  { id: 'sert', title: 'À quoi il sert' },
  { id: 'quand', title: 'Quand l’utiliser' },
  { id: 'eviter', title: 'Quand ne pas l’utiliser' },
  { id: 'exemples', title: 'Exemples' },
  { id: 'variantes', title: 'Variantes' },
  { id: 'accessibilite', title: 'Accessibilité' },
  { id: 'proprietes', title: 'Propriétés' },
  { id: 'jetons', title: 'Jetons utilisés' },
  { id: 'preuves', title: 'Preuves et décisions' },
];

const filled = (value: string | readonly unknown[]): boolean =>
  typeof value === 'string' ? value.trim() !== '' : value.length > 0;

/** Champs obligatoires et leur valeur, pour un message d'erreur qui nomme le champ vide. */
function requiredFields(data: ComponentPageData): [string, string | readonly unknown[]][] {
  return [
    ['summary', data.summary],
    ['use', data.use],
    ['avoid', data.avoid],
    ['a11y.keyboard', data.a11y.keyboard],
    ['a11y.screenReader', data.a11y.screenReader],
    ['a11y.guaranteed', data.a11y.guaranteed],
    ['a11y.integrator', data.a11y.integrator],
    ['evidence', data.evidence],
  ];
}

/** Lève une erreur claire si un champ obligatoire est vide. */
export function validate(data: ComponentPageData): ComponentPageData {
  for (const [name, value] of requiredFields(data)) {
    if (!filled(value)) {
      throw new Error(`ComponentPage « ${data.slug} » : le champ « ${name} » est vide.`);
    }
  }
  return data;
}
