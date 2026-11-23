// Captures PNG du parcours de badges (contrôle visuel de l'ADR-0013) : début, chaque jalon, objectif,
// gros plan de la médaille, survol d'une médaille active et d'une autre, panneau, à 1440x900 et
// 390x844. Options : --out <dossier>, --base <url> (sinon sert apps/docs/dist), --dark (thème
// sombre), --reduced (mouvement réduit), --quick (quelques étapes). Chromium avec WebGL logiciel.
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchOptions } from './browser.ts';
import { DEMO_HASH, ENHANCED, PAGE } from './model.ts';
import { serve } from './server.ts';

const SIZES = { bureau: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const SETTLE_MS = 2500;
const TEXTURE_MS = 3000;
const STEPS = '.pp-milestones__select';
const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    base: { type: 'string' },
    dark: { type: 'boolean' },
    reduced: { type: 'boolean' },
    quick: { type: 'boolean' },
  },
});

async function ready(page: Page): Promise<void> {
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline && (await page.locator(ENHANCED).count()) === 0) {
    await page.keyboard.press('Shift');
    await page.waitForTimeout(400);
  }
  await page.locator(ENHANCED).waitFor({ timeout: 1000 });
  await page.waitForTimeout(TEXTURE_MS);
}

async function toStart(page: Page): Promise<void> {
  await page.evaluate(() => {
    const track = document.querySelector('[data-pp-track]');
    if (track) window.scrollTo(0, track.getBoundingClientRect().top + window.scrollY);
  });
  await page.waitForTimeout(SETTLE_MS);
}

/** Centre et haut de l'étiquette visible, active ou non : la médaille est juste au-dessus. */
async function labelBox(page: Page, active: boolean) {
  const selector = `.pp-milestones__label${active ? '[data-active]' : ':not([data-active]):not([data-hidden])'}`;
  return page.locator(selector).first().boundingBox();
}

async function hoverAbove(page: Page, active: boolean, file: string): Promise<void> {
  const box = await labelBox(page, active);
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y - (active ? 90 : 28));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: file });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
}

async function closeUp(page: Page, file: string): Promise<void> {
  const box = await labelBox(page, true);
  if (!box) return;
  const clip = {
    x: Math.max(0, box.x + box.width / 2 - 210),
    y: Math.max(0, box.y - 330),
    width: 420,
    height: 380,
  };
  await page.screenshot({ path: file, clip });
}

async function tour(page: Page, dir: string, tag: string): Promise<void> {
  const shot = (name: string) => page.screenshot({ path: join(dir, `${tag}-${name}.png`) });
  await ready(page);
  await toStart(page);
  await shot('01-debut');
  const count = await page.locator(STEPS).count();
  const wanted = new Set([0, 3, 5, 6, count - 1]);
  for (let i = 0; i < count; i += 1) {
    if (values.quick && !wanted.has(i)) continue;
    await page.locator(STEPS).nth(i).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(SETTLE_MS);
    await shot(`02-${i === count - 1 ? 'objectif' : `jalon-${String(i + 1).padStart(2, '0')}`}`);
    if (i === 5) {
      await closeUp(page, join(dir, `${tag}-03-gros-plan.png`));
      await hoverAbove(page, true, join(dir, `${tag}-04-survol-actif.png`));
      await hoverAbove(page, false, join(dir, `${tag}-04-survol-autre.png`));
      await page
        .locator('[data-pp-panel]')
        .screenshot({ path: join(dir, `${tag}-05-panneau.png`) });
    }
  }
}

const out = resolve(values.out ?? 'captures');
mkdirSync(out, { recursive: true });
const served = values.base ? null : await serve('apps/docs/dist');
const base = values.base ?? served?.url ?? '';
const browser = await chromium.launch(launchOptions('chromium', 'software', process.env));
for (const [name, viewport] of Object.entries(SIZES)) {
  const context = await browser.newContext({
    viewport,
    colorScheme: values.dark ? 'dark' : 'light',
    reducedMotion: values.reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  await page.goto(`${base}${PAGE}${DEMO_HASH}`);
  const tag = [name, values.reduced ? 'reduit' : '', values.dark ? 'sombre' : '']
    .filter(Boolean)
    .join('-');
  await tour(page, out, tag).catch((error) => console.error(tag, String(error)));
  await context.close();
}
await browser.close();
await served?.close();
console.log(`captures : ${out}`);
