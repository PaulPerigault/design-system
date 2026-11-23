// Lecture du repère d'étapes en mode amélioré : bouton actif (`aria-current="step"`), panneau de
// détail du jalon affiché, défilement de la page.
import type { Page } from '@playwright/test';
import { ENHANCED } from './model.ts';

export const STEP_BUTTONS = `${ENHANCED} .pp-milestones__select`;
export const PANEL = `${ENHANCED} [data-pp-panel]`;
const CURRENT_TIMEOUT_MS = 6_000;

/** Position (0 à n-1) du bouton qui porte `aria-current="step"`, -1 si aucun. */
export async function currentIndex(page: Page): Promise<number> {
  return page
    .locator(STEP_BUTTONS)
    .evaluateAll((buttons) =>
      buttons.findIndex((button) => button.getAttribute('aria-current') === 'step'),
    );
}

/** Attend que l'étape `index` soit l'étape active ; vrai si c'est le cas avant le délai. */
export async function untilCurrent(page: Page, index: number): Promise<boolean> {
  try {
    await page.waitForFunction(
      ([selector, wanted]) => {
        const buttons = Array.from(document.querySelectorAll(String(selector)));
        return buttons[Number(wanted)]?.getAttribute('aria-current') === 'step';
      },
      [STEP_BUTTONS, index] as const,
      { timeout: CURRENT_TIMEOUT_MS },
    );
    return true;
  } catch {
    return false;
  }
}

/** Texte du détail affiché dans le panneau (vide si aucun détail n'est visible). */
export async function shownDetail(page: Page): Promise<string> {
  return page.locator(`${PANEL} [data-pp-detail]:not([hidden])`).evaluateAll((details) =>
    details
      .map((detail) => detail.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export const scrollY = (page: Page): Promise<number> => page.evaluate(() => window.scrollY);

/** Nom de chaque étape, dans l'ordre de la liste. */
export async function stepNames(page: Page): Promise<string[]> {
  return page
    .locator(STEP_BUTTONS)
    .evaluateAll((buttons) => buttons.map((button) => (button.textContent ?? '').trim()));
}

/** Attend qu'un détail de jalon soit affiché dans le panneau (il suit la caméra d'une image). */
export async function untilDetail(page: Page): Promise<string> {
  try {
    await page.waitForFunction(
      (selector) => document.querySelector(String(selector)) !== null,
      `${PANEL} [data-pp-detail]:not([hidden])`,
      { timeout: CURRENT_TIMEOUT_MS },
    );
  } catch {
    // Pas de détail : la lecture ci-dessous rend une chaîne vide et le contrôle échoue.
  }
  return shownDetail(page);
}
