import { expect, test, type Page } from '@playwright/test';
import { VISUAL_PROJECTS } from '../devices';
import { PAGES, THEMES, visit } from '../helpers';

/** Part de pixels autorisée à différer d'une référence (anticrénelage du moteur de rendu). */
const MAX_DIFF_PIXEL_RATIO = 0.01;

/** Les captures dépendent du système (polices, rendu) : références valables sur le runner CI seul. */
test.skip(process.env.PP_VISUAL !== '1', 'Régression visuelle : PP_VISUAL=1 (runner CI) requis.');

// Densité 1 : une référence pèse neuf fois moins qu'à 3, et les écarts de mise en page restent visibles.
test.use({ deviceScaleFactor: 1 });

/** `/components/stack/` devient `components-stack` ; la racine devient `index`. */
function slugOf(path: string): string {
  return path.replace(/^\/|\/$/g, '').replaceAll('/', '-') || 'index';
}

/** Les images `loading="lazy"` hors fenêtre se chargent pendant la capture : on les décode d'abord. */
async function settleImages(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map((image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    ),
  );
}

/** Gabarits de page : les deux thèmes. */
const TEMPLATE_PAGES = [
  '/',
  '/composants/',
  '/identite/',
  '/utiliser/',
  '/architecture/',
  '/accessibilite/',
  '/decisions/',
];

/** Un composant par famille : les deux thèmes ; les autres composants, thème clair seul. */
const DARK_COMPONENTS = ['alert', 'button', 'card', 'dialog', 'photo', 'stack', 'tabs'].map(
  (slug) => `/components/${slug}/`,
);

/** Poids des références (versionnées) : les pages de texte seul et le thème sombre sont échantillonnés. */
function themesOf(path: string) {
  if (TEMPLATE_PAGES.includes(path) || DARK_COMPONENTS.includes(path)) return THEMES;
  return path.startsWith('/components/') ? THEMES.slice(0, 1) : [];
}

for (const path of PAGES) {
  for (const theme of themesOf(path)) {
    test(`visuel : ${path}, thème ${theme}`, async ({ page }) => {
      test.skip(
        !VISUAL_PROJECTS.includes(test.info().project.name),
        'Appareil hors matrice visuelle.',
      );
      await visit(page, path, theme);
      await settleImages(page);
      await expect(page).toHaveScreenshot(`${slugOf(path)}-${theme}.png`, {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
      });
    });
  }
}
