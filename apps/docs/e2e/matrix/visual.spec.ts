import { expect, test } from '@playwright/test';
import { PAGES, THEMES, visit } from '../helpers';

/** Part de pixels autorisée à différer d'une référence (anticrénelage du moteur de rendu). */
const MAX_DIFF_PIXEL_RATIO = 0.01;

/** Les captures dépendent du système (polices, rendu) : références valables sur le runner CI seul. */
test.skip(process.env.PP_VISUAL !== '1', 'Régression visuelle : PP_VISUAL=1 (runner CI) requis.');

/** `/components/stack/` devient `components-stack` ; la racine devient `index`. */
function slugOf(path: string): string {
  return path.replace(/^\/|\/$/g, '').replaceAll('/', '-') || 'index';
}

// Mêmes pages que axe.spec.ts × 2 thèmes, sur chaque appareil de la matrice (projet).
for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`visuel : ${path}, thème ${theme}`, async ({ page }) => {
      await visit(page, path, theme);
      await expect(page).toHaveScreenshot(`${slugOf(path)}-${theme}.png`, {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
      });
    });
  }
}
