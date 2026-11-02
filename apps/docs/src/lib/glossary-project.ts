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
  {
    id: 'apca',
    term: 'APCA',
    definition:
      'Accessible Perceptual Contrast Algorithm, méthode de calcul du contraste proposée pour WCAG 3 (brouillon). Le dépôt la mesure en plus du rapport de contraste de WCAG 2, qui reste la référence.',
  },
  {
    id: 'build',
    term: 'build',
    definition:
      'Construction du site : les sources sont compilées en fichiers statiques prêts à être servis.',
  },
  {
    id: 'ci',
    term: 'CI',
    definition:
      "Intégration continue : chaque proposition de modification passe automatiquement les contrôles du dépôt (tests, lint, build) avant d'être fusionnée.",
  },
  {
    id: 'cli',
    term: 'CLI',
    definition:
      'Interface en ligne de commande : un programme qui se lance depuis un terminal, comme `pp-create`.',
  },
  {
    id: 'delta-e',
    term: 'ΔE',
    definition:
      "Écart entre deux couleurs, mesuré pour qu'un même nombre corresponde à une même différence perçue. Le dépôt utilise ΔE00 (CIEDE2000) pour tenir ses palettes distinctes.",
  },
  {
    id: 'dto',
    term: 'DTO',
    definition:
      'Data Transfer Object : type qui décrit une donnée entrante (JSON, argument, fichier) une fois validée à la frontière du programme. Le reste du code ne reçoit que des DTO valides.',
  },
  {
    id: 'e2e',
    term: 'e2e',
    definition:
      'Test de bout en bout : un navigateur réel parcourt les pages construites, comme un visiteur le ferait.',
  },
  {
    id: 'lttb',
    term: 'LTTB',
    definition:
      'Largest-Triangle-Three-Buckets (Steinarsson, 2013) : algorithme qui réduit une série de mesures à moins de points en gardant la forme de la courbe.',
  },
  {
    id: 'props',
    term: 'props',
    definition:
      "Propriétés d'un composant : les valeurs que l'on lui passe pour le configurer (variante, texte, état).",
  },
  {
    id: 'slot',
    term: 'slot',
    definition:
      "Emplacement d'un composant Astro où l'on place son propre contenu, par exemple le texte d'un bouton.",
  },
  {
    id: 'workflow',
    term: 'workflow',
    definition:
      'Suite de tâches automatiques décrite dans `.github/workflows/` et lancée par GitHub (contrôles, publication).',
  },
];
