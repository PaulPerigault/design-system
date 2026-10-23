import { expect, test } from '@playwright/test';
import { SECTIONS } from '../src/lib/component-page';
import { COMPONENT_PAGES, VIEWPORTS, open } from './helpers';

/** Sections sans lesquelles une page n'est pas conforme au gabarit (variantes : facultative). */
const REQUIRED = SECTIONS.map((section) => section.id).filter((id) => id !== 'variantes');
const ORDER = SECTIONS.map((section) => section.id);

for (const path of COMPONENT_PAGES) {
  test(`gabarit : ${path} suit l'ordre fixe des sections`, async ({ page }) => {
    await open(page, path, VIEWPORTS[0]);
    const ids = await page.locator('main h2[id]').evaluateAll((nodes) => nodes.map((n) => n.id));
    expect(ids.filter((id) => ORDER.includes(id))).toEqual(ORDER.filter((id) => ids.includes(id)));
    for (const id of REQUIRED) expect(ids, `section ${id}`).toContain(id);
    await expect(page.getByRole('navigation', { name: "Fil d'Ariane" })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Sur cette page' })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Pages voisines' })).toHaveCount(1);
  });
}
