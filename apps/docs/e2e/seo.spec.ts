import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { PAGES } from './helpers.ts';

const SITE = 'https://design.paulperigault.dev';
const KNOWN_TYPES = new Set([
  'Person',
  'WebSite',
  'SoftwareSourceCode',
  'TechArticle',
  'BreadcrumbList',
  'ListItem',
]);
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 170;

interface PageSeo {
  h1: number;
  title: string;
  description: string | null;
  canonical: string | null;
  ogImage: string | null;
  jsonLd: string[];
}

/** Types déclarés, à tous les niveaux d'un nœud JSON-LD. */
function typesOf(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(typesOf);
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) =>
    key === '@type' ? [String(value)] : typesOf(value),
  );
}

const read = (page: Page): Promise<PageSeo> =>
  page.evaluate(() => {
    const meta = (selector: string, attribute: string) =>
      document.querySelector(selector)?.getAttribute(attribute) ?? null;
    return {
      // Les exemples rendus (ex. Prose) montrent des titres de démonstration : hors décompte.
      h1: document.querySelectorAll('h1:not(.pp-component-page__examples h1)').length,
      title: document.title,
      description: meta('meta[name="description"]', 'content'),
      canonical: meta('link[rel="canonical"]', 'href'),
      ogImage: meta('meta[property="og:image"]', 'content'),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
        (script) => script.textContent ?? '',
      ),
    };
  });

const seen = new Map<string, PageSeo>();

test.describe('SEO par page', () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await page.goto(path);
      const seo = await read(page);
      seen.set(path, seo);
      expect(seo.h1).toBe(1);
      expect(seo.title.trim()).not.toBe('');
      expect(seo.description?.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(seo.description?.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(seo.canonical).toBe(`${SITE}${path}`);
      expect(seo.canonical?.endsWith('/')).toBe(true);
      expect(seo.ogImage).toMatch(new RegExp(`^${SITE}/og/[a-z0-9-]+\\.png$`));
      for (const raw of seo.jsonLd) {
        const types = typesOf(JSON.parse(raw));
        expect(types.length).toBeGreaterThan(0);
        for (const type of types) expect(KNOWN_TYPES.has(type), type).toBe(true);
      }
    });
  }
});

test('titres et descriptions uniques sur tout le site', async ({ page }) => {
  for (const path of PAGES) {
    if (!seen.has(path)) {
      await page.goto(path);
      seen.set(path, await read(page));
    }
  }
  for (const key of ['title', 'description'] as const) {
    const values = [...seen.values()].map((seo) => seo[key]);
    expect(new Set(values).size, `${key} dupliqué`).toBe(values.length);
  }
});

test('sitemap.xml liste chaque page', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  for (const path of PAGES) expect(xml).toContain(`<loc>${SITE}${path}</loc>`);
});

test('robots.txt référence le sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});
