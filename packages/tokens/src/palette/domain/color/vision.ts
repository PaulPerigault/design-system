import type { Oklch } from '../../../lib/color.ts';
import { CVD_KINDS, simulateCvd } from './cvd.ts';
import { deltaE2000 } from './delta-e.ts';
import { toLinear } from './gamut.ts';
import type { Lab } from './lab.ts';
import { linearSrgbToLab } from './lab.ts';

/** Couleur vue en vision normale puis en protanopie, deutéranopie et tritanopie. */
export type VisionLabs = readonly Lab[];

export function visionLabs(color: Oklch): VisionLabs {
  const linear = toLinear(color);
  return [linear, ...CVD_KINDS.map((kind) => simulateCvd(linear, kind))].map(linearSrgbToLab);
}

/** Pire ΔE00 des quatre visions : deux couleurs sont aussi distinctes que leur pire cas. */
export function visionDistance(a: VisionLabs, b: VisionLabs): number {
  return Math.min(...a.map((lab, index) => deltaE2000(lab, b[index] ?? lab)));
}

/** Plus petit écart de toutes les paires d'une liste (Infinity si moins de deux couleurs). */
export function minPairDistance(colors: readonly Oklch[]): number {
  const labs = colors.map(visionLabs);
  let min = Number.POSITIVE_INFINITY;
  for (const [i, first] of labs.entries()) {
    for (const second of labs.slice(i + 1)) min = Math.min(min, visionDistance(first, second));
  }
  return min;
}

/** Plus petit écart entre voisins d'une rampe ordonnée. */
export function minStepDistance(colors: readonly Oklch[]): number {
  const labs = colors.map(visionLabs);
  const steps = labs.slice(1).map((lab, index) => visionDistance(labs[index] ?? lab, lab));
  return Math.min(...steps);
}
