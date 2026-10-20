import { expect, test } from '@playwright/test';
import { PAGES, TARGET_MIN, VIEWPORTS, open } from './helpers';

interface Target {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Liens et boutons visibles hors texte courant (exécuté dans la page). */
function collectTargets(): Target[] {
  const selector = 'a[href], button, [role="button"], input[type="button"], input[type="submit"]';
  return [...document.querySelectorAll(selector)]
    .filter((el) => !el.closest('p, li'))
    .map((el) => {
      const r = el.getBoundingClientRect();
      const label = (el.textContent ?? '').trim() || el.tagName;
      return { label, x: r.x, y: r.y, width: r.width, height: r.height };
    })
    .filter((t) => t.width > 0 && t.height > 0);
}

const isLarge = (t: Target) => t.width >= TARGET_MIN && t.height >= TARGET_MIN;
const center = (t: Target) => ({ cx: t.x + t.width / 2, cy: t.y + t.height / 2 });

/** Distance du point au rectangle (0 si le point est dedans). */
function distanceToRect(px: number, py: number, t: Target): number {
  const dx = Math.max(t.x - px, 0, px - (t.x + t.width));
  const dy = Math.max(t.y - py, 0, py - (t.y + t.height));
  return Math.hypot(dx, dy);
}

/**
 * Exception d'espacement de 2.5.8 : le cercle de 24 px centré sur la cible ne recoupe
 * ni une autre cible, ni le cercle d'une autre cible trop petite.
 */
function respectsSpacing(target: Target, all: Target[]): boolean {
  const radius = TARGET_MIN / 2;
  const { cx, cy } = center(target);
  return all
    .filter((other) => other !== target)
    .every((other) => {
      if (distanceToRect(cx, cy, other) < radius) return false;
      if (isLarge(other)) return true;
      const o = center(other);
      return Math.hypot(cx - o.cx, cy - o.cy) >= TARGET_MIN;
    });
}

for (const path of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`cibles ≥ 24 px : ${path}, ${viewport.name}`, async ({ page }) => {
      await open(page, path, viewport);
      const targets = await page.evaluate(collectTargets);
      const failing = targets
        .filter((t) => !isLarge(t) && !respectsSpacing(t, targets))
        .map((t) => `${t.label} (${t.width.toFixed(1)} × ${t.height.toFixed(1)})`);
      expect(failing).toEqual([]);
    });
  }
}
