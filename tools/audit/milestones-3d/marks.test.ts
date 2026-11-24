import { describe, expect, it } from 'vitest';
import { framingDetail, parseMarks, worstMargin } from './marks.ts';

const AREA = { width: 400, height: 800 };

describe('parseMarks', () => {
  it('lit quatre nombres par étape', () => {
    expect(parseMarks([0.5, 0.25, 0.1, 1, 0.9, 0.1, 0.05, 0])).toEqual([
      { x: 0.5, y: 0.25, scale: 0.1, visible: true },
      { x: 0.9, y: 0.1, scale: 0.05, visible: false },
    ]);
  });
});

describe('worstMargin', () => {
  it('prend la plus faible marge de l’active et de ses deux suivantes seulement', () => {
    const marks = parseMarks([
      0.3, 0.7, 0.1, 1, 0.5, 0.4, 0.05, 1, 0.8, 0.2, 0.05, 1, 0.99, 0.5, 0.2, 1,
    ]);
    // active 0 : rayon 80 px, centre (120, 560) : gauche 40/400 = 0,10 ; bas 160/800 = 0,20
    expect(worstMargin(marks, 0, AREA, false)).toBeCloseTo(0.1, 5);
    // le quatrième repère (hors cadrage voulu) ne compte pas
    expect(worstMargin(marks.slice(0, 3), 0, AREA, false)).toBeCloseTo(0.1, 5);
  });

  it('format compact (sous 480 px) : l’active seule compte, les suivantes peuvent déborder', () => {
    const marks = parseMarks([0.5, 0.5, 0.1, 1, 0.99, 0.5, 0.2, 1]);
    expect(worstMargin(marks, 0, AREA)).toBeCloseTo(0.3, 5);
    expect(worstMargin(marks, 0, AREA, false)).toBeLessThan(0);
  });

  it('rend null si une médaille cadrée est invisible, ou s’il n’y en a pas', () => {
    expect(worstMargin(parseMarks([0.5, 0.5, 0.05, 0]), 0, AREA)).toBeNull();
    expect(worstMargin([], 0, AREA)).toBeNull();
  });

  it('une médaille qui déborde donne une marge négative', () => {
    expect(worstMargin(parseMarks([0.05, 0.5, 0.05, 1]), 0, AREA)).toBeLessThan(0);
  });
});

describe('framingDetail', () => {
  it('accepte 6 % et refuse moins', () => {
    expect(framingDetail(0.06).ok).toBe(true);
    expect(framingDetail(0.05).ok).toBe(false);
    expect(framingDetail(null).ok).toBe(false);
  });
});
