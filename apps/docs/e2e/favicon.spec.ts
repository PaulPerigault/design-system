import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PAGES } from './helpers';

/**
 * Favicon du portfolio servi à l'identique (même jeu de fichiers, mêmes `<link>`) : empreintes
 * SHA-256 recopiées de `scripts/favicon-integrity.test.mjs` du portfolio. Le favicon ne change
 * jamais par accident ; une modification voulue met à jour les deux dépôts.
 */
const FINGERPRINTS: Record<string, string> = {
  '/favicon.ico': '0dc82df44421fbb9bac3940bdcf5a82e263738a4415aa73d2bf4adad917dcb6b',
  '/favicon-16x16.png': 'd99080c31409001ec7e819943b1460411f5fc76493e8a6482592865aaa8e3942',
  '/favicon-32x32.png': '8b3dc8403b6504cb94c704a4230b45628fce1bbeef7cd54bce50d1bea5c51c4d',
  '/apple-touch-icon.png': '32011fb0ccbc3d81047a2179c94505a389ea9f087f8d40de0256c08e33efbb8b',
  '/image/logo.svg': '9010c480299d79cb3617a02c028f9786626d8503a1848b52fd07bf20afa68085',
};

const LINKS = [
  'link[rel="icon"][href="/favicon.ico"][sizes="48x48"]',
  'link[rel="icon"][type="image/svg+xml"][href="/image/logo.svg"]',
  'link[rel="icon"][type="image/png"][sizes="32x32"][href="/favicon-32x32.png"]',
  'link[rel="icon"][type="image/png"][sizes="16x16"][href="/favicon-16x16.png"]',
  'link[rel="apple-touch-icon"][sizes="180x180"][href="/apple-touch-icon.png"]',
];

for (const [path, expected] of Object.entries(FINGERPRINTS)) {
  test(`favicon : ${path} servi avec l'empreinte du portfolio`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const digest = createHash('sha256')
      .update(await response.body())
      .digest('hex');
    expect(digest).toBe(expected);
  });
}

test('chaque page déclare les mêmes liens d’icône que le portfolio', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    for (const selector of LINKS)
      await expect(page.locator(selector), `${path} ${selector}`).toHaveCount(1);
  }
});
