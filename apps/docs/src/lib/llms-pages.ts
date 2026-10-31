/** Pages de documentation citées par `/llms.txt`, hors composants. */
export interface DocPage {
  path: string;
  title: string;
  description: string;
}

export const DOC_PAGES: readonly DocPage[] = [
  {
    path: '/identite/',
    title: 'Identité',
    description: 'Quatre directions de couleur comparées, avec contrastes WCAG 2 calculés.',
  },
  {
    path: '/accessibilite/',
    title: 'Accessibilité',
    description: 'Choix d’accessibilité, preuves de test et état de conformité.',
  },
  {
    path: '/glossaire/',
    title: 'Glossaire',
    description: 'Définitions des termes techniques utilisés dans la documentation.',
  },
  {
    path: '/donnees/',
    title: 'Données',
    description:
      'Huit composants de visualisation : démonstrations, contrat de données, accessibilité.',
  },
  {
    path: '/tableau-de-bord/',
    title: 'Tableau de bord',
    description:
      'Démonstration d’un tableau de bord : indicateurs, graphiques et tableau filtrable sur des données fictives.',
  },
  {
    path: '/recherche/',
    title: 'Recherche',
    description: 'Recherche dans la documentation, qui demande JavaScript.',
  },
];
