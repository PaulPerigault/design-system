/** Mentions légales : données de l'éditeur et garde-fou de production (logique pure). */

export interface Legal {
  /** Éditeur, personne physique. */
  publisher: string;
  /** Hébergeur (nom et adresse). Vide tant que Paul ne l'a pas renseigné. */
  host: string;
  /** Adresse de contact. Vide tant que Paul ne l'a pas renseignée. */
  contact: string;
  /** Licence du code (identifiant SPDX). */
  licenseCode: string;
  /** Licence des contenus et de l'identité. Vide : « licence à choisir par Paul ». */
  licenseContent: string;
}

export type Env = Readonly<Record<string, string | undefined>>;

export const LEGAL: Legal = {
  publisher: 'Paul Perigault',
  host: '',
  contact: '',
  licenseCode: 'MIT',
  licenseContent: '',
};

/** Champs que la LCEN (article 6 III) impose à l'éditeur et à l'hébergeur. */
const REQUIRED_IN_PRODUCTION: readonly (keyof Legal)[] = ['host', 'contact'];

const isBlank = (value: string): boolean => value.trim() === '';

/** Noms des champs vides, dans l'ordre de l'interface. */
export function legalProblems(legal: Legal): (keyof Legal)[] {
  return (Object.keys(legal) as (keyof Legal)[]).filter((key) => isBlank(legal[key]));
}

/** Lève une erreur si `PP_PRODUCTION` vaut `1` et qu'un champ obligatoire est vide. */
export function assertProductionReady(legal: Legal, env: Env): void {
  if (env.PP_PRODUCTION !== '1') return;
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => isBlank(legal[key]));
  if (missing.length > 0) {
    throw new Error(`Mentions légales incomplètes en production : ${missing.join(', ')}`);
  }
}
