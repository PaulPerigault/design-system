import type { Entry } from './glossary';

/** Termes de développement et de contrôle. */
export const GLOSSARY_DEV: readonly Entry[] = [
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
