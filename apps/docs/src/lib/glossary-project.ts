import type { Entry } from './glossary';

export const GLOSSARY_PROJECT: readonly Entry[] = [
  {
    id: 'adr',
    term: 'ADR',
    definition:
      'Architecture Decision Record, note courte qui consigne une décision, son contexte et ses conséquences.',
  },
  {
    id: 'dtcg',
    term: 'DTCG',
    definition:
      "Design Tokens Community Group du W3C, qui publie le format d'échange des jetons de design. Ce dépôt suit la version 2025.10.",
  },
  {
    id: 'gamut',
    term: 'gamut',
    definition:
      "Ensemble des couleurs qu'un espace ou un écran peut afficher. Le sRGB est le plus courant sur le web.",
  },
  {
    id: 'invoker-commands',
    term: 'Invoker Commands',
    definition:
      'API HTML qui relie un bouton à un élément via les attributs command et commandfor, sans script.',
  },
  {
    id: 'jeton-accent-text',
    term: "jeton de texte d'accent",
    definition:
      "`--pp-color-accent-text` : la couleur d'accent quand elle sert à du texte (liens, onglets, fil d'Ariane). Sa valeur initiale est celle de `--pp-color-accent`, qui garde les aplats. Un site remappe l'un sans l'autre.",
  },
  {
    id: 'jeton-prose',
    term: 'jeton de longueur de ligne',
    definition:
      '`--pp-size-prose` : largeur maximale du texte courant. Sa valeur initiale est celle de `--pp-size-measure`, qui reste la largeur des images, des alertes et des cadres.',
  },
  {
    id: 'jeton',
    term: 'jeton',
    definition:
      'Valeur de design nommée et réutilisable, comme une couleur ou un espacement. Ici, les jetons portent le préfixe --pp-.',
  },
  {
    id: 'llms-txt',
    term: 'llms.txt',
    definition:
      "Fichier texte à la racine d'un site qui résume son contenu pour les modèles de langage. Proposé en 2024.",
  },
  {
    id: 'mcp',
    term: 'MCP',
    definition:
      "Model Context Protocol, protocole ouvert qui relie des modèles d'IA à des outils et à des sources de données.",
  },
  {
    id: 'oklch',
    term: 'OKLCH',
    definition:
      'Espace de couleur perceptuel décrit par la luminosité, la chroma et la teinte, proposé par Björn Ottosson en 2020.',
  },
  {
    id: 'provenance-npm',
    term: 'provenance npm',
    definition:
      'Attestation signée qui indique le dépôt et le workflow ayant produit un paquet publié sur npm.',
  },
  {
    id: 'registre',
    term: 'registre',
    definition:
      'Liste des composants publiés avec leurs fichiers. Le fichier registry.json est régénéré par npm run registry.',
  },
  {
    id: 'sbom',
    term: 'SBOM',
    definition:
      'Software Bill of Materials, inventaire des composants logiciels qui entrent dans un artefact, avec leurs versions.',
  },
];
