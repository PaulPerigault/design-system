import type { Entry } from './glossary';

/** Termes d'outils et de publication ajoutés par #211 (règle FALC 11 : expliquer les mots difficiles). */
export const GLOSSARY_OUTILS: readonly Entry[] = [
  {
    id: 'axe-core',
    term: 'axe-core',
    definition:
      'Bibliothèque qui contrôle automatiquement l’accessibilité d’une page. Un contrôle automatique ne couvre pas tous les critères.',
  },
  {
    id: 'brotli',
    term: 'brotli',
    definition:
      'Algorithme de compression des fichiers envoyés au navigateur. Il réduit la taille transférée sans changer le contenu.',
  },
  {
    id: 'gzip',
    term: 'gzip',
    definition:
      'Algorithme de compression des fichiers envoyés au navigateur. Il réduit la taille transférée sans changer le contenu.',
  },
  {
    id: 'oidc',
    term: 'OIDC',
    definition:
      'OpenID Connect : protocole par lequel un service prouve son identité à un autre. Le workflow de publication l’utilise face à npm.',
  },
  {
    id: 'playwright',
    term: 'Playwright',
    definition:
      'Bibliothèque qui pilote un navigateur par programme. Le dépôt l’utilise pour ses tests de bout en bout (e2e).',
  },
  {
    id: 'svg',
    term: 'SVG',
    definition:
      'Format d’image vectorielle décrit en texte. Les graphiques du dépôt sont dessinés ainsi, sans image bitmap.',
  },
  {
    id: 'trusted-publishing',
    term: 'trusted publishing',
    definition:
      'Publication de confiance : npm accepte un paquet venant d’un workflow GitHub déclaré à l’avance et identifié par OIDC.',
  },
];
