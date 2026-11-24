import { describe, expect, it } from 'vitest';
import { BADGE_SPAN, badgeBox, badgeTransform } from '../src/behaviors/milestones-3d-badge-box';
import type { Mark } from '../src/behaviors/milestones-3d-types';

const mark: Mark = { id: 'a', x: 0.5, y: 0.5, scale: 0.2, visible: true };
const area = { width: 1000, height: 500 };

describe('boîte du badge', () => {
  it('couvre BADGE_SPAN du diamètre du support avec le plus grand côté', () => {
    const box = badgeBox(mark, { width: 512, height: 512 }, area);
    expect(512 * box.factor).toBeCloseTo(BADGE_SPAN * 2 * 0.2 * 500);
  });

  it('centre l’image sur la médaille, quel que soit son rapport', () => {
    const box = badgeBox(mark, { width: 400, height: 200 }, area);
    expect(box.left + (400 * box.factor) / 2).toBeCloseTo(500);
    expect(box.top + (200 * box.factor) / 2).toBeCloseTo(250);
  });

  it('n’écrit qu’une translation et une échelle uniforme', () => {
    const css = badgeTransform(badgeBox(mark, { width: 300, height: 200 }, area));
    expect(css).toMatch(/^translate\([-\d.e]+px, [-\d.e]+px\) scale\([\d.e-]+\)$/);
    expect(css).not.toMatch(/rotate|skew|perspective|matrix|scale\([^)]*,/);
  });

  it('cache l’image hors cadre, sans taille connue ou sans hauteur de scène', () => {
    const natural = { width: 100, height: 100 };
    expect(badgeBox({ ...mark, visible: false }, natural, area).visible).toBe(false);
    expect(badgeBox(mark, { width: 0, height: 0 }, area).visible).toBe(false);
    expect(badgeBox(mark, natural, { width: 10, height: 0 }).visible).toBe(false);
  });

  it('range les médailles proches au-dessus des lointaines', () => {
    const near = badgeBox({ ...mark, scale: 0.3 }, { width: 10, height: 10 }, area);
    const far = badgeBox({ ...mark, scale: 0.1 }, { width: 10, height: 10 }, area);
    expect(near.depth).toBeGreaterThan(far.depth);
  });
});
