import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { checkOgImages } from '../scripts/og-check.mjs';
import { nodeFs, pageOf } from '../scripts/og-pages.mjs';
import { PAGES } from './helpers.ts';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

/** Une page construite (`/components/button/` → `components/button/index.html`) et son contrôle. */
async function problemsOf(path: string): Promise<{ image: string | null; problems: string[] }> {
  const page = await pageOf(nodeFs, DIST, `${path.slice(1)}index.html`);
  return {
    image: page.image,
    problems: await checkOgImages([page], { fs: nodeFs, distDir: DIST }),
  };
}

test.describe('images Open Graph', () => {
  for (const path of PAGES) {
    test(`${path} : og:image pointe vers un PNG 1200×630 présent dans dist/og/`, async () => {
      const { problems } = await problemsOf(path);
      expect(problems).toEqual([]);
    });
  }

  test('au moins une page déclare og:image (le contrôle n’est pas vide)', async () => {
    const declared = await Promise.all(PAGES.map(async (path) => (await problemsOf(path)).image));
    expect(declared.filter(Boolean).length).toBeGreaterThan(0);
  });
});
