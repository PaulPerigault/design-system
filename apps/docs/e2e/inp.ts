import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Seuil minimal de `durationThreshold` accepté par Chromium pour les entrées `event`. */
const EVENT_THRESHOLD_MS = 16;

export interface InpEntry {
  duration: number;
  /** Attente avant le traitement, traitement, puis rendu (« presentation delay »), en ms. */
  parts: [number, number, number];
}

/** INP (ms) : événement le plus long d'un clic sur le bouton du menu, avec sa décomposition. */
export async function readInp(page: Page): Promise<InpEntry> {
  await page.evaluate((threshold) => {
    const seen: InpEntry[] = [];
    (window as unknown as { __ppInp: InpEntry[] }).__ppInp = seen;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as PerformanceEventTiming[]) {
        const wait = e.processingStart - e.startTime;
        const work = e.processingEnd - e.processingStart;
        seen.push({ duration: e.duration, parts: [wait, work, e.duration - wait - work] });
      }
    }).observe({
      type: 'event',
      durationThreshold: threshold,
      buffered: true,
    } as PerformanceObserverInit);
  }, EVENT_THRESHOLD_MS);
  await page.locator('.docs-menu-button').click();
  await expect(page.locator('dialog#docs-menu')).toBeVisible();
  // Les entrées `event` sont livrées après le rendu de la trame suivant l'interaction.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => setTimeout(done))));
  const seen = await page.evaluate(() => (window as unknown as { __ppInp: InpEntry[] }).__ppInp);
  return seen.reduce((max, e) => (e.duration > max.duration ? e : max), {
    duration: 0,
    parts: [0, 0, 0],
  });
}
