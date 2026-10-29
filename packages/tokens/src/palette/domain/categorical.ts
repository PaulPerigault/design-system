import type { Oklch } from '../../lib/color.ts';
import { contrastRatio } from '../../lib/contrast.ts';
import { fitToGamut } from './color/gamut.ts';
import type { VisionLabs } from './color/vision.ts';
import { visionDistance, visionLabs } from './color/vision.ts';
import { CATEGORICAL_COUNT, MIN_GRAPHIC_CONTRAST } from './thresholds.ts';
import type { ThemeBase } from './types.ts';

const HUE_STEP = 15;
const FULL_TURN = 360;
const LIGHTNESS_FROM = 0.2;
const LIGHTNESS_TO = 0.98;
const LIGHTNESS_STEP = 0.04;
/** Multiplicateurs du chroma de l'accent : des tons plus ou moins vifs que lui. */
const CHROMA_FACTORS = Object.values({ muted: 0.5, same: 1, vivid: 1.6, vivider: 2.4 });
/** En deçà, la couleur se lit comme un gris : elle ne serait plus « une couleur de série ». */
const MIN_CHROMA = 0.06;
/** Une série ne doit pas se confondre avec le texte courant. */
const MIN_DELTA_FROM_TEXT = 10;

interface Candidate {
  readonly color: Oklch;
  readonly labs: VisionLabs;
}

const range = (from: number, to: number, step: number): number[] =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => from + index * step);

const grid = (hue: number, chroma: number): Oklch[] =>
  range(0, FULL_TURN - HUE_STEP, HUE_STEP).flatMap((offset) =>
    range(LIGHTNESS_FROM, LIGHTNESS_TO, LIGHTNESS_STEP).flatMap((l) =>
      CHROMA_FACTORS.map((factor) =>
        fitToGamut({ l, c: chroma * factor, h: (hue + offset) % FULL_TURN }),
      ),
    ),
  );

function candidates(base: ThemeBase, hue: number): Candidate[] {
  const text = visionLabs(base.fg);
  return grid(hue, base.accent.c)
    .filter(
      (color) => color.c >= MIN_CHROMA && contrastRatio(color, base.bg) >= MIN_GRAPHIC_CONTRAST,
    )
    .map((color) => ({ color, labs: visionLabs(color) }))
    .filter(({ labs }) => visionDistance(labs, text) >= MIN_DELTA_FROM_TEXT);
}

const distanceToChosen = (candidate: Candidate, chosen: readonly Candidate[]): number =>
  Math.min(...chosen.map((other) => visionDistance(candidate.labs, other.labs)));

/**
 * Couleurs de série : l'accent d'abord, puis, une à une, la candidate la plus éloignée de celles
 * déjà prises (farthest-point sampling), la distance étant le pire ΔE00 des quatre visions.
 */
export function deriveCategorical(base: ThemeBase, hue: number): Oklch[] {
  const accent = fitToGamut({ ...base.accent, h: hue });
  const chosen: Candidate[] = [{ color: accent, labs: visionLabs(accent) }];
  const pool = candidates(base, hue);
  while (chosen.length < CATEGORICAL_COUNT && pool.length > 0) {
    const scores = pool.map((candidate) => distanceToChosen(candidate, chosen));
    const best = scores.indexOf(Math.max(...scores));
    const [picked] = pool.splice(best, 1);
    if (picked) chosen.push(picked);
  }
  return chosen.map(({ color }) => color);
}
