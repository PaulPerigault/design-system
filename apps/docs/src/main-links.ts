/**
 * Entrées principales de la documentation : source unique de l'en-tête (écran large) et du panneau
 * du menu mobile (sous 48 rem, l'en-tête tient sur une rangée : marque et « Menu », audit M-5).
 */
export interface MainLink {
  href: string;
  title: string;
}

export const MAIN_LINKS: readonly MainLink[] = [
  { href: '/utiliser/', title: 'Démarrer' },
  { href: '/composants/#composants', title: 'Composants' },
  { href: '/donnees/', title: 'Données' },
  { href: '/preuves/', title: 'Preuves' },
  { href: '/auteur/', title: 'Auteur' },
  { href: '/recherche/', title: 'Recherche' },
];

/** Pages du site hors en-tête, proposées en plus dans le panneau mobile. */
export const MORE_LINKS: readonly MainLink[] = [
  { href: '/glossaire/', title: 'Glossaire' },
  { href: '/accessibilite/', title: 'Accessibilité' },
];
