import type { BarRect, SeriesInk } from '@paulperigault/dataviz';
import { createFormatter } from '@paulperigault/dataviz';
import { describe, expect, it } from 'vitest';
import { PLOT } from '../src/data/chart/frame.ts';
import { valueLabels } from '../src/data/chart/bar-values.ts';
import type { ValueContext } from '../src/data/chart/bar-values.ts';
import { inkAttribute } from '../src/data/chart/ink.ts';

const fmt = createFormatter('fr');
if (!fmt.ok) throw new Error(fmt.error.message);

const LARGE: Omit<BarRect, 'series' | 'value'> = { index: 0, x: 80, y: 60, width: 40, height: 120 };
const rect = (series: number, value: number): BarRect => ({ ...LARGE, series, value });
const context = (inks: readonly SeriesInk[]): ValueContext => ({
  orientation: 'vertical',
  plot: PLOT,
  fmt: fmt.value,
  inks,
});
const FG_ON_LIGHT: SeriesInk = { light: 'fg', dark: 'bg' };
const NONE: SeriesInk = { light: null, dark: 'bg' };

describe('inkAttribute', () => {
  it('écrit le neutre clair puis sombre', () => {
    expect(inkAttribute(FG_ON_LIGHT)).toBe('fg-bg');
  });

  it('ne dit rien si un thème n’a aucun neutre à 4,5:1', () => {
    expect(inkAttribute(NONE)).toBeUndefined();
    expect(inkAttribute(undefined)).toBeUndefined();
  });
});

describe('valueLabels (couleur selon la série)', () => {
  it('groupe par série et pose sur la barre le neutre de la série', () => {
    const groups = valueLabels([rect(0, 5), rect(1, 7)], context([FG_ON_LIGHT, FG_ON_LIGHT]));
    expect(groups.map((g) => [g.series, g.ink, g.labels.map((l) => l.inside)])).toEqual([
      [0, 'fg-bg', [true]],
      [1, 'fg-bg', [true]],
    ]);
  });

  it('pose la valeur hors de la barre quand aucun neutre n’atteint 4,5:1', () => {
    const [group] = valueLabels([rect(0, 5)], context([NONE]));
    expect(group?.ink).toBeUndefined();
    expect(group?.labels[0]?.inside).toBe(false);
  });

  it('pose hors de la barre une valeur nulle, quelle que soit la série', () => {
    const [group] = valueLabels([rect(0, 0)], context([FG_ON_LIGHT]));
    expect(group?.labels[0]?.inside).toBe(false);
  });

  it('n’écrit rien si une barre est trop étroite pour sa valeur', () => {
    const narrow: BarRect = { ...rect(0, 1234), width: 10 };
    expect(valueLabels([rect(0, 5), narrow], context([FG_ON_LIGHT]))).toEqual([]);
  });
});
