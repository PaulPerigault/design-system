import type { Locator } from '@playwright/test';

/** Fixe la largeur d'un conteneur par le CSSOM (la CSP interdit l'attribut `style`, pas le CSSOM). */
export const widen = (element: Locator, rem: number) =>
  element.evaluate((el, value) => ((el as HTMLElement).style.inlineSize = `${value}rem`), rem);

/** La barre dépliée d'un menu ou d'un en-tête est visible (le repli ne l'est plus). */
export const unfolded = (menu: Locator) => menu.locator('.pp-site-menu__bar').isVisible();
