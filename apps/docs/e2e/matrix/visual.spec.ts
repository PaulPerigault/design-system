import { expect, test } from '@playwright/test';
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

// Mêmes pages que axe.spec.ts × 2 thèmes, sur chaque projet de VISUAL_PROJECTS.
for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`visuel : ${path}, thème ${theme}`, async ({ page }) => {
      test.skip(
        !VISUAL_PROJECTS.includes(test.info().project.name),
        'Appareil hors matrice visuelle.',
      );
      await visit(page, path, theme);
      await expect(page).toHaveScreenshot(`${slugOf(path)}-${theme}.png`, {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
      });
    });
  }
}
