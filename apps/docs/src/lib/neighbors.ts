/** Pages voisines d'une page de composant, dans l'ordre aplati de la navigation (logique pure). */
import { GROUPS } from '../navigation';
import type { DocGroup, DocLink } from '../navigation';

export interface Neighbors {
  /** Groupe de la page courante. */
  group: DocGroup;
  /** Page précédente dans l'ordre aplati ; `undefined` pour la première. */
  previous: DocLink | undefined;
  /** Page suivante dans l'ordre aplati ; `undefined` pour la dernière. */
  next: DocLink | undefined;
}

interface Entry {
  group: DocGroup;
  link: DocLink;
}

/** Toutes les pages à plat, dans l'ordre du menu : le changement de groupe est traité comme un pas. */
const flatten = (groups: readonly DocGroup[]): Entry[] =>
  groups.flatMap((group) => group.links.map((link) => ({ group, link })));

/**
 * Précédent et suivant de `slug`. Lève une erreur claire si la page ne figure pas dans la navigation.
 * `groups` est injectable pour les tests ; par défaut, la navigation réelle.
 */
export function neighborsOf(slug: string, groups: readonly DocGroup[] = GROUPS): Neighbors {
  const entries = flatten(groups);
  const position = entries.findIndex((entry) => entry.link.slug === slug);
  const current = entries[position];
  if (current === undefined) {
    throw new Error(`Page absente de la navigation : « ${slug} ».`);
  }
  return {
    group: current.group,
    previous: entries[position - 1]?.link,
    next: entries[position + 1]?.link,
  };
}
