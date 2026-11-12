/** Types et constructeur de lien du sommaire de la documentation (voir `navigation.ts`). */
export interface DocLink {
  slug: string;
  title: string;
}

export interface DocGroup {
  /** Identifiant d'ancre, sans espace. */
  id: string;
  title: string;
  links: DocLink[];
}

export const link = (slug: string, title: string): DocLink => ({ slug, title });
