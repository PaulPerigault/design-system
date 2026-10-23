import type { Entry } from './glossary';

export const GLOSSARY_WEB: readonly Entry[] = [
  {
    id: 'aria',
    term: 'ARIA',
    definition:
      "Accessible Rich Internet Applications, spécification du W3C qui ajoute rôles, états et propriétés aux éléments HTML pour les technologies d'assistance.",
  },
  {
    id: 'cls',
    term: 'CLS',
    definition:
      'Cumulative Layout Shift, somme des décalages de mise en page inattendus pendant la vie de la page. Bon en dessous de 0,1.',
  },
  {
    id: 'core-web-vitals',
    term: 'Core Web Vitals',
    definition:
      "Trois mesures de Google sur l'expérience réelle : LCP, INP et CLS, évaluées au 75e centile des visites.",
  },
  {
    id: 'csp',
    term: 'CSP',
    definition:
      "Content Security Policy, en-tête HTTP qui limite les sources de scripts, de styles et d'images autorisées sur une page.",
  },
  {
    id: 'cible-tactile',
    term: 'cible tactile',
    definition:
      'Zone qui répond à un contact ou à un clic. WCAG 2.2, critère 2.5.8, demande au moins 24 × 24 px CSS au niveau AA.',
  },
  {
    id: 'contraste-wcag',
    term: 'contraste WCAG',
    definition:
      'Rapport de luminance entre texte et fond, calculé selon WCAG 2. Le critère 1.4.3 exige au moins 4,5:1 pour le texte courant.',
  },
  {
    id: 'dialog',
    term: 'dialog',
    definition:
      'Élément HTML de boîte de dialogue. Ouvert avec showModal(), il gère le focus et rend le reste de la page inerte.',
  },
  {
    id: 'focus-visible',
    term: 'focus visible',
    definition:
      "Indicateur qui montre l'élément actif au clavier. Le critère 2.4.7 de WCAG 2.2 l'exige au niveau AA.",
  },
  {
    id: 'inp',
    term: 'INP',
    definition:
      "Interaction to Next Paint, délai entre une interaction utilisateur et l'affichage de la réponse. Remplace FID en mars 2024.",
  },
  {
    id: 'lcp',
    term: 'LCP',
    definition:
      "Largest Contentful Paint, délai d'affichage du plus grand élément visible de la page. Bon en dessous de 2,5 s au 75e centile.",
  },
  {
    id: 'lecteur-d-ecran',
    term: "lecteur d'écran",
    definition:
      "Logiciel qui restitue l'interface par la parole ou en braille, par exemple NVDA, JAWS ou VoiceOver.",
  },
  {
    id: 'mouvement-reduit',
    term: 'mouvement réduit',
    definition:
      'Préférence système, lue par prefers-reduced-motion, qui demande de limiter les animations.',
  },
  {
    id: 'popover',
    term: 'popover',
    definition:
      'Attribut HTML qui affiche un contenu par-dessus la page. Le navigateur gère son ouverture et sa fermeture sans script.',
  },
  {
    id: 'propriete-logique',
    term: 'propriété logique',
    definition:
      'Propriété CSS liée au sens du texte, comme inline-start ou block-size, au lieu de left ou top.',
  },
  {
    id: 'requete-de-conteneur',
    term: 'requête de conteneur',
    definition:
      'Règle CSS @container qui adapte un composant à la largeur de son conteneur, et non à celle de la fenêtre.',
  },
  {
    id: 'reflow',
    term: 'reflow',
    definition:
      'Adaptation du contenu à une largeur de 320 px CSS sans défilement horizontal. Critère 1.4.10, niveau AA.',
  },
  {
    id: 'rgaa',
    term: 'RGAA',
    definition:
      "Référentiel général d'amélioration de l'accessibilité, référentiel français fondé sur les WCAG et utilisé pour les services publics.",
  },
  {
    id: 'wcag',
    term: 'WCAG',
    definition:
      "Web Content Accessibility Guidelines, recommandations du W3C pour l'accessibilité du web. La version 2.2 date d'octobre 2023.",
  },
  {
    id: 'zone-sure',
    term: 'zone sûre',
    definition:
      "Partie de l'écran à l'écart des encoches, des coins arrondis et des barres système, où le contenu reste visible.",
  },
];
