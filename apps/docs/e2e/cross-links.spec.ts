import { expect, test } from '@playwright/test';
import {
  checkReciprocal,
  crossLinksActive,
  findNodes,
  personProblems,
  websiteProblems,
} from '../src/lib/cross-links.ts';
import { AUTHOR, SITE_URL } from '../src/lib/site.ts';
import { PAGES } from './helpers.ts';

/** Variable lue ici, par l'appelant : la lib ne touche jamais à l'environnement. */
const ACTIVE = crossLinksActive(process.env.PORTFOLIO_LINK_CHECK);

test.describe('liens vers le portfolio (hors ligne)', () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      const head = page.locator('head link[rel~="author"]');
      await expect(head).toHaveCount(1);
      await expect(head).toHaveAttribute('href', AUTHOR.url);
      const footer = page.locator('footer a[rel~="author"]');
      await expect(footer).toHaveCount(1);
      await expect(footer).toHaveAttribute('href', AUTHOR.url);
      await expect(footer).toBeVisible();

      const raw = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((scripts) => scripts.map((script) => script.textContent ?? ''));
      for (const data of raw.map((text) => JSON.parse(text) as unknown)) {
        for (const node of findNodes(data, 'Person')) expect(personProblems(node)).toEqual([]);
        for (const node of findNodes(data, 'WebSite')) expect(websiteProblems(node)).toEqual([]);
      }
    });
  }

  test('l’accueil publie Person et WebSite, relié à SITE_URL', async ({ page }) => {
    await page.goto('/');
    const texts = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) => scripts.map((script) => script.textContent ?? ''));
    const data = texts.map((text) => JSON.parse(text) as unknown);
    expect(data.flatMap((item) => findNodes(item, 'Person')).length).toBeGreaterThan(0);
    const sites = data.flatMap((item) => findNodes(item, 'WebSite'));
    expect(sites).toHaveLength(1);
    expect(sites[0]?.url).toBe(`${SITE_URL}/`);
  });
});

test.describe('réciprocité portfolio → design', () => {
  test.skip(
    !ACTIVE,
    'Réseau requis : poser PORTFOLIO_LINK_CHECK=1 pour interroger paulperigault.fr.',
  );

  test('paulperigault.fr contient un lien vers le site design', async () => {
    const state = await checkReciprocal((url) => fetch(url), AUTHOR.url, SITE_URL);
    expect(state, `${AUTHOR.url} → ${SITE_URL}`).toBe('present');
  });
});
