/** Parcours de démonstration de la page Milestones3D (entièrement fictif). */

const badge = (file: string) => ({
  src: `/milestones-3d/${file}.webp`,
  width: 512,
  height: 512,
});
const verify = (slug: string) => `https://example.org/verifier/${slug}`;

/**
 * Jalons de démonstration, déclarés volontairement dans le désordre (le composant les trie par
 * date). Tout est fictif : émetteurs génériques, codes d'examen inventés, badges générés par
 * `tools/fixtures/milestones-badges.ts`. Un jalon obtenu sans badge, un jalon prévu sans date.
 */
export const DEMO_MILESTONES = [
  {
    id: 'cloud-avance',
    label: 'Ingénierie Cloud, niveau avancé',
    status: 'achieved',
    group: 'Atelier Cloud',
    date: '2025-09',
    code: 'CLD-301',
    badge: badge('test-badge-3'),
    href: verify('cloud-avance'),
    description:
      'Déploiement, supervision et reprise après incident d’une plateforme à plusieurs zones.',
  },
  {
    id: 'cloud-bases',
    label: 'Fondamentaux du Cloud',
    status: 'achieved',
    group: 'Atelier Cloud',
    date: '2023-03',
    code: 'CLD-101',
    badge: badge('test-badge-arc'),
    href: verify('cloud-bases'),
    description: 'Notions de base : calcul, stockage, réseau et partage des responsabilités.',
  },
  {
    id: 'donnees-associe',
    label: 'Analyse de données, niveau associé',
    status: 'achieved',
    group: 'Collectif Données',
    date: '2024-06',
    code: 'DAT-201',
    badge: badge('test-badge-2'),
    href: verify('donnees-associe'),
    description: 'Nettoyage, modélisation et restitution de jeux de données tabulaires.',
  },
  {
    id: 'securite',
    label: 'Sécurité des systèmes, niveau associé',
    status: 'planned',
    group: 'Institut Sécurité',
    date: '2026-09',
    code: 'SEC-250',
    description: 'Examen prévu à l’automne 2026.',
  },
  {
    id: 'reseaux',
    label: 'Réseaux et protocoles',
    status: 'achieved',
    group: 'Fabrique Réseau',
    date: '2022-11',
    code: 'NET-110',
    badge: badge('test-badge-4'),
    href: verify('reseaux'),
    description: 'Adressage, routage et diagnostic des couches basses.',
  },
  {
    id: 'architecture',
    label: 'Architecture de solutions',
    status: 'planned',
    group: 'Atelier Cloud',
    date: '2027-02',
    code: 'ARC-400',
    description: 'Niveau le plus élevé de la filière, à préparer après la sécurité.',
  },
  {
    id: 'integration-continue',
    label: 'Pratique de l’intégration continue',
    status: 'achieved',
    group: 'Fabrique Réseau',
    date: '2024-10',
    description: 'Attestation de suivi, sans badge numérique : le jalon reste dans le parcours.',
  },
  {
    id: 'ia-appliquee',
    label: 'IA appliquée aux données',
    status: 'planned',
    group: 'Collectif Données',
    code: 'AIA-300',
    description: 'Sans date arrêtée : ce jalon suit celui qui le précède dans la déclaration.',
  },
] as const;

export const DEMO_GOAL = {
  label: 'Architecte certifié, parcours complet',
  date: '2027-06',
  description: 'Objectif final : réunir les certifications de la filière.',
} as const;
