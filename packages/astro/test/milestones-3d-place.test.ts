import { describe, expect, it } from 'vitest';
import { moved } from '../src/behaviors/milestones-3d-moved';
import { LABEL_GAP_PX, placeLabels } from '../src/behaviors/milestones-3d-place';
import type { Mark } from '../src/behaviors/milestones-3d-types';

const AREA = { width: 1000, height: 500 };
const SIZE = { width: 100, height: 40 };
const mark = (id: string, x: number, y = 0.5, visible = true): Mark => ({
  id,
  x,
  y,
  scale: 0.1,
  visible,
});
const sizes = (...ids: string[]) => new Map(ids.map((id) => [id, SIZE]));

describe('placeLabels', () => {
  it('pose l’étiquette centrée sous la médaille', () => {
    const placed = placeLabels([mark('a', 0.5)], sizes('a'), AREA, null).get('a');
    expect(placed).toEqual({ left: 450, top: 250 + 50 * 1.12 + LABEL_GAP_PX, visible: true });
  });

  it('cache une étiquette dont la médaille est invisible ou hors cadre', () => {
    const marks = [mark('hidden', 0.3, 0.5, false), mark('left', 0.01), mark('low', 0.7, 0.95)];
    const placed = placeLabels(marks, sizes('hidden', 'left', 'low'), AREA, null);
    expect([...placed.values()].map((p) => p.visible)).toEqual([false, false, false]);
  });

  it('cache la moins prioritaire entre deux étiquettes qui se chevauchent', () => {
    const marks = [mark('a', 0.5), mark('b', 0.55)];
    const byActive = placeLabels(marks, sizes('a', 'b'), AREA, 'b');
    expect(byActive.get('b')?.visible).toBe(true);
    expect(byActive.get('a')?.visible).toBe(false);
    const other = placeLabels(marks, sizes('a', 'b'), AREA, 'a');
    expect(other.get('a')?.visible).toBe(true);
    expect(other.get('b')?.visible).toBe(false);
  });

  it('garde toutes les étiquettes qui ne se chevauchent pas', () => {
    const marks = [mark('a', 0.2), mark('b', 0.5), mark('c', 0.8)];
    const placed = placeLabels(marks, sizes('a', 'b', 'c'), AREA, 'b');
    expect([...placed.values()].every((p) => p.visible)).toBe(true);
  });

  it('préfère la plus proche de l’active quand trois se chevauchent', () => {
    const marks = [mark('a', 0.5), mark('b', 0.56), mark('c', 0.62)];
    const placed = placeLabels(marks, sizes('a', 'b', 'c'), AREA, 'a');
    expect(placed.get('b')?.visible).toBe(false);
    expect(placed.get('c')?.visible).toBe(true);
  });
});

describe('placeLabels (médaille active)', () => {
  it('cache les étiquettes qui recouvriraient la médaille active, jamais la sienne', () => {
    const marks = [mark('a', 0.5), mark('behind', 0.5, 0.45), mark('far', 0.9, 0.3)];
    const placed = placeLabels(marks, sizes('a', 'behind', 'far'), AREA, 'a');
    expect(placed.get('a')?.visible).toBe(true);
    expect(placed.get('behind')?.visible).toBe(false);
    expect(placed.get('far')?.visible).toBe(true);
  });
});

describe('placeLabels (autres médailles)', () => {
  it('cache une étiquette qui recouvrirait la médaille d’une autre étape, active ou non', () => {
    const marks = [mark('a', 0.5, 0.45), mark('b', 0.5, 0.6)];
    const placed = placeLabels(marks, sizes('a', 'b'), AREA, null);
    expect(placed.get('a')?.visible).toBe(false);
    expect(placed.get('b')?.visible).toBe(true);
  });
});

describe('moved', () => {
  it('détecte un déplacement, un changement de visibilité ou de nombre', () => {
    const before = [mark('a', 0.5)];
    expect(moved(before, [mark('a', 0.5)])).toBe(false);
    expect(moved(before, [mark('a', 0.5001)])).toBe(false);
    expect(moved(before, [mark('a', 0.6)])).toBe(true);
    expect(moved(before, [mark('a', 0.5, 0.5, false)])).toBe(true);
    expect(moved(before, [])).toBe(true);
  });
});
