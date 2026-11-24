import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { activate, hasWasm } from './milestones-3d';

const SPRITES = '[data-milestones-demo] .pp-milestones__sprite:not([data-hidden])';
const SIZES = [
  { name: 'bureau', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
const RATIO_TOLERANCE = 0.01;
const SETTLE_MS = 1500;

interface Measure {
  matrix: number[];
  filter: string;
  blend: string;
  opacity: string;
  clip: string;
  hidden: string | null;
  alt: string | null;
  width: number;
  height: number;
  natural: [number, number];
}

/** Style calculé et boîte de chaque badge affiché : ce que voit la personne. */
const measure = (page: Page): Promise<Measure[]> =>
  page.evaluate((selector) => {
    return [...document.querySelectorAll<HTMLImageElement>(selector)].map((image) => {
      const style = getComputedStyle(image);
      const box = image.getBoundingClientRect();
      const values = style.transform.match(/-?[\d.e-]+/g)?.map(Number) ?? [];
      return {
        matrix: values,
        filter: style.filter,
        blend: style.mixBlendMode,
        opacity: style.opacity,
        clip: `${style.clipPath}|${style.maskImage}|${style.borderRadius}`,
        hidden: image.getAttribute('aria-hidden'),
        alt: image.getAttribute('alt'),
        width: box.width,
        height: box.height,
        natural: [image.naturalWidth, image.naturalHeight] as [number, number],
      };
    });
  }, SPRITES);

test.describe('badges en images HTML intactes (ADR-0014)', () => {
  test.skip(!hasWasm(), 'build sans .wasm');

  for (const size of SIZES) {
    test(`${size.name} : translation et échelle uniforme, rapport naturel, aria-hidden`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await activate(page);
      await page.waitForTimeout(SETTLE_MS);
      const badges = await measure(page);
      expect(badges.length).toBeGreaterThan(0);
      for (const badge of badges) {
        const [a = 0, b = 0, c = 0, d = 0] = badge.matrix;
        // matrix(a, b, c, d, tx, ty) : pas de rotation ni de biais, échelle identique sur les deux axes.
        expect(badge.matrix).toHaveLength(6);
        expect(b).toBeCloseTo(0, 6);
        expect(c).toBeCloseTo(0, 6);
        expect(a).toBeCloseTo(d, 6);
        expect(a).toBeGreaterThan(0);
        expect(badge.filter).toBe('none');
        expect(badge.blend).toBe('normal');
        expect(badge.opacity).toBe('1');
        expect(badge.clip).toBe('none|none|0px');
        expect(badge.hidden).toBe('true');
        expect(badge.alt).toBe('');
        const [naturalWidth, naturalHeight] = badge.natural;
        const ratio = naturalWidth / naturalHeight;
        expect(Math.abs(badge.width / badge.height / ratio - 1)).toBeLessThan(RATIO_TOLERANCE);
      }
    });
  }

  test('aucune perspective ni rotation sur le conteneur des badges', async ({ page }) => {
    await activate(page);
    const layer = await page.evaluate(() => {
      const node = document.querySelector('[data-milestones-demo] .pp-milestones__sprites');
      const style = getComputedStyle(node as Element);
      return [style.transform, style.perspective, style.filter, style.opacity];
    });
    expect(layer).toEqual(['none', 'none', 'none', '1']);
  });
});
