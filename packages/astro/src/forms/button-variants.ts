import { variants } from '../lib/variants';

/** Classes de Button : ton et taille, valeurs par défaut `primary` et `m`. */
export const button = variants({
  base: 'pp-button',
  variants: {
    tone: {
      primary: 'pp-button--primary',
      secondary: 'pp-button--secondary',
      quiet: 'pp-button--quiet',
    },
    size: { m: 'pp-button--m', l: 'pp-button--l' },
  },
  defaults: { tone: 'primary', size: 'm' },
});
