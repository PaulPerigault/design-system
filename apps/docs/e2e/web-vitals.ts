import type { Page } from '@playwright/test';

/** Mesures accumulées dans la page par les observateurs injectés. */
interface Vitals {
  cls: number;
  lcp: Element | null;
}

declare global {
  interface Window {
    __ppVitals?: Vitals;
  }
}

/** Entrées non typées par lib.dom : seuls les champs lus ici. */
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
interface LcpEntry extends PerformanceEntry {
  element: Element | null;
}

function observe(): void {
  const vitals: Vitals = { cls: 0, lcp: null };
  window.__ppVitals = vitals;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShiftEntry[]) {
      if (!entry.hadRecentInput) vitals.cls += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((list) => {
    const last = list.getEntries().at(-1) as LcpEntry | undefined;
    if (last) vitals.lcp = last.element;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}

/** À appeler avant `page.goto` : les observateurs démarrent avec le document. */
export const injectVitals = (page: Page): Promise<void> => page.addInitScript(observe);

/** Somme des décalages de mise en page hors interaction (CLS). */
export const readCls = (page: Page): Promise<number> =>
  page.evaluate(() => window.__ppVitals?.cls ?? Number.NaN);

/** Vrai si l'élément visé par `selector` est le dernier élément LCP mesuré. */
export const isLcp = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((target) => {
    const lcp = window.__ppVitals?.lcp;
    return lcp !== null && lcp !== undefined && lcp === document.querySelector(target);
  }, selector);
