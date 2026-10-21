import { expect, test } from '@playwright/test';
import { PAGES, TARGET_MIN, visit } from '../helpers';

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

/** Contrôles principaux : 44 × 44 px (WCAG 2.5.5, AAA ; Apple 44 pt, Material 48 dp). */
const PRIMARY_MIN = 44;
const PRIMARY = [
  '.pp-button',
  'main input:not([type=checkbox], [type=radio], [type=hidden])',
  'main select',
  'main textarea',
  '.pp-dialog__close',
  '.pp-gallery-dialog__close',
  '.docs-menu-button',
].join(', ');

function smallPrimaries({ selector, min }: { selector: string; min: number }): string[] {
  return [...document.querySelectorAll(selector)]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0)
    .filter(({ r }) => r.width < min || r.height < min)
    .map(
      ({ el, r }) =>
        `${el.tagName}.${el.className} (${r.width.toFixed(1)} × ${r.height.toFixed(1)})`,
    );
}

for (const path of PAGES) {
  test(`cibles ≥ 24 px et espacement : ${path}`, async ({ page }) => {
    await visit(page, path);
    const targets = await page.evaluate(collectTargets);
    const failing = targets
      .filter((t) => !isLarge(t) && !respectsSpacing(t, targets))
      .map((t) => `${t.label} (${t.width.toFixed(1)} × ${t.height.toFixed(1)})`);
    expect(failing).toEqual([]);
  });

  test(`contrôles principaux ≥ 44 px : ${path}`, async ({ page }) => {
    await visit(page, path);
    expect(await page.evaluate(smallPrimaries, { selector: PRIMARY, min: PRIMARY_MIN })).toEqual(
      [],
    );
  });
}
