import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Chemins des pages construites (`…/index.html`), lus dans `dist/` : aucune liste à la main. */
function builtPages(): string[] {
  const files = readdirSync(DIST, { recursive: true, encoding: 'utf8' });
  // `readdir` renvoie des `\` sous Windows : les chemins de pages sont des URL.
  const pages = files
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
    .map((file) => `/${file.slice(0, -'index.html'.length)}`)
    .sort();
  // Échec fermé : sans build, aucune page ne serait testée en silence.
  if (pages.length === 0) throw new Error(`Aucune page construite dans ${DIST} : lancer le build.`);
  return pages;
}

/** Toutes les pages construites : axe, 1.4.12 et tailles de cibles les parcourent toutes. */
export const PAGES = builtPages();

/** Pages de composants (`/components/<slug>/`). */
export const COMPONENT_PAGES = PAGES.filter((path) => path.startsWith('/components/'));

/** Pages qui chargent les tokens et la CSS du design system. */
export const STYLED_PAGES = ['/identite/', '/components/stack/'] as const;

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const VIEWPORTS = [
  { name: 'bureau', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
export type Viewport = (typeof VIEWPORTS)[number];

/** Taille minimale d'une cible (WCAG 2.2, critère 2.5.8), en pixels CSS. */
export const TARGET_MIN = 24;

/** Pose `data-theme` sur `<html>` et attend la fin des transitions de couleur qu’il déclenche. */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate(async (value) => {
    document.documentElement.setAttribute('data-theme', value);
    // Transitions seulement : une animation infinie (Progress indéterminé) ne finit jamais.
    const transitions = document.getAnimations().filter((a) => a instanceof CSSTransition);
    await Promise.all(transitions.map((transition) => transition.finished));
  }, theme);
}

/** Ouvre une page à la taille de l'appareil du projet (matrice), thème appliqué. */
export async function visit(page: Page, path: string, theme?: Theme) {
  await page.goto(path);
  if (theme) await setTheme(page, theme);
}

/** Ouvre une page au viewport donné, thème appliqué. */
export async function open(page: Page, path: string, viewport: Viewport, theme?: Theme) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(path);
  if (theme) await setTheme(page, theme);
}
