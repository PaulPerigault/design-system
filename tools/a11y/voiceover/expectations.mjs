// Attentes de la procédure manuelle (docs/a11y/manual-checklist.md, étapes 2 à 4), sous forme de
// motifs sur le texte prononcé. VoiceOver parle la langue du système : chaque motif couvre le
// français et l'anglais. Un motif absent du texte prononcé est un écart à écouter, pas une preuve.
export const PAGES = [
  '/',
  '/identite/',
  '/components/button/',
  '/components/dialog/',
  '/components/accordion/',
  '/components/select/',
  '/components/switch/',
];

/** Points communs à toutes les pages (étape 4) : un motif suffit à les considérer comme annoncés. */
export const COMMON = [
  {
    id: 'evitement',
    label: 'Lien d’évitement en premier arrêt',
    pattern: /contenu|content|passer|skip/i,
    first: true,
  },
  {
    id: 'reperes',
    label: 'Repères annoncés (navigation, principal)',
    pattern: /navigation|principal|main|banni|banner/i,
  },
  { id: 'titres', label: 'Titres annoncés', pattern: /titre|heading/i },
  { id: 'listes', label: 'Listes annoncées', pattern: /liste|list/i },
  { id: 'liens', label: 'Liens annoncés', pattern: /lien|link/i },
];

/** Composants interactifs (étape 3) : page, éléments attendus et motif du texte prononcé. */
export const COMPONENTS = [
  {
    id: 'Dialog',
    page: '/components/dialog/',
    checks: [{ element: 'Annonce', expected: 'Nom, rôle dialogue', pattern: /dialogue|dialog/i }],
  },
  {
    id: 'Accordion',
    page: '/components/accordion/',
    checks: [
      {
        element: 'Annonce',
        expected: 'Nom, état replié ou déplié',
        pattern: /repli|déplié|collapsed|expanded/i,
      },
    ],
  },
  {
    id: 'Select',
    page: '/components/select/',
    checks: [
      {
        element: 'Annonce',
        expected: 'Nom, rôle, valeur, état',
        pattern: /liste déroulante|menu local|pop.?up|combo/i,
      },
    ],
  },
  {
    id: 'Switch',
    page: '/components/switch/',
    checks: [
      {
        element: 'Annonce',
        expected: 'Nom, rôle, état',
        pattern: /interrupteur|switch|activé|désactivé|on\b|off\b/i,
      },
    ],
  },
];
