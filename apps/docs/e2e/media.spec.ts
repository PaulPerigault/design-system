import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { THEMES, VIEWPORTS, open } from './helpers';
import { injectVitals, isLcp, readCls } from './web-vitals';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
const PAGES = [
  '/components/photo/',
  '/components/art-direction/',
  '/components/figure/',
  '/components/scrim/',
  '/components/avatar/',
  '/components/project-cover/',
  '/components/gallery/',
];
/** Seuil « bon » du CLS (Core Web Vitals, convention Google). */
const CLS_GOOD = 0.1;
const PRIORITY = 'main img[fetchpriority="high"]';

/** Défile jusqu'en bas par écrans, puis attend le chargement de chaque image visible. */
async function scrollAndSettle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(requestAnimationFrame);
    }
  });
  await page.waitForFunction(() =>
    [...document.querySelectorAll('main img')]
      .filter((img) => img.checkVisibility())
      .every((img) => (img as HTMLImageElement).complete),
  );
}

for (const path of PAGES) {
  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`axe : ${path}, thème ${theme}, ${viewport.name}`, async ({ page }) => {
        await open(page, path, viewport, theme);
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(violations.map((v) => `${v.id} (${v.nodes.length}) : ${v.help}`)).toEqual([]);
      });
    }

    test(`CLS < ${CLS_GOOD} : ${path}, ${viewport.name}`, async ({ page }, testInfo) => {
      await injectVitals(page);
      await open(page, path, viewport);
      await scrollAndSettle(page);
      const cls = await readCls(page);
      testInfo.annotations.push({ type: 'CLS', description: cls.toFixed(4) });
      expect(cls).toBeLessThan(CLS_GOOD);
    });
  }

  test(`dimensions, aucun style en ligne, img dans picture : ${path}`, async ({ page }) => {
    await open(page, path, VIEWPORTS[0]);
    const report = await page.evaluate(() => {
      const sized = [...document.querySelectorAll('main img, main source[media]')];
      return {
        unsized: sized.filter((el) => !el.hasAttribute('width') || !el.hasAttribute('height'))
          .length,
        styled: document.querySelectorAll('main [style]').length,
        loose: [...document.querySelectorAll('main img')].filter((img) => !img.closest('picture'))
          .length,
      };
    });
    expect(report).toEqual({ unsized: 0, styled: 0, loose: 0 });
  });
}

test('photo : une seule image prioritaire, élément LCP, servie en AVIF', async ({ page }) => {
  await injectVitals(page);
  await open(page, '/components/photo/', VIEWPORTS[0]);
  const priority = page.locator(PRIORITY);
  await expect(priority).toHaveCount(1);
  await expect(priority).toHaveAttribute('loading', 'eager');
  await expect(
    page.locator('main img:not([fetchpriority="high"]):not([loading="lazy"])'),
  ).toHaveCount(0);
  await priority.evaluate((img: HTMLImageElement) => img.decode());
  expect(await priority.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/\.avif$/);
  await expect.poll(() => isLcp(page, PRIORITY)).toBe(true);
});
