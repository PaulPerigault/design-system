/** Étape rendue de Milestones3D : un jalon ou l'objectif, et les aides du balisage. */
import type { FormattedDate, MilestoneBadge, MilestoneStatus } from './milestones-3d-model';

/** Un jalon ou l'objectif, prêt à écrire : dates mises en forme, statut en toutes lettres. */
export interface Step {
  id: string;
  label: string;
  /** `goal` pour l'objectif final. */
  status: MilestoneStatus | 'goal';
  state: string;
  group?: string;
  code?: string;
  badge?: MilestoneBadge;
  href?: string;
  description?: string;
  when?: FormattedDate;
}

/** Identifiant de l'objectif dans le balisage et dans `project()` du paquet 3D. */
export const GOAL_ID = '@goal';

/** Lien absolu : le navigateur quitte le site, la relation protège l'ouverture. */
export const isExternal = (href: string): boolean => /^https?:/i.test(href);

const slug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Identifiant de l'ancre qui suit la section : celui de la page, ou dérivé du nom de la région. */
export const endAnchor = (id: string | undefined, name: string): string =>
  id ?? `pp-milestones-end-${slug(name) || 'parcours'}`;
