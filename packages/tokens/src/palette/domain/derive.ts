import type { Oklch } from '../../lib/color.ts';
import { contrastRatio } from '../../lib/contrast.ts';
import { fitToGamut } from './color/gamut.ts';
import { minPairDistance, minStepDistance } from './color/vision.ts';
import type { Result } from './result.ts';
import { fail, ok } from './result.ts';
import { deriveCategorical } from './categorical.ts';
import { deriveDiverging, deriveSequential } from './ramps.ts';
import {
  CATEGORICAL_COUNT,
  MIN_CATEGORICAL_DELTA,
  MIN_STEP_DELTA,
  MIN_TEXT_CONTRAST,
} from './thresholds.ts';
import type { Palettes, Theme, ThemeBase } from './types.ts';

const FULL_TURN = 360;

const normalizeHue = (hue: number): number => ((hue % FULL_TURN) + FULL_TURN) % FULL_TURN;
const finite = (color: Oklch): boolean =>
  Number.isFinite(color.l) && Number.isFinite(color.c) && Number.isFinite(color.h);

function checkBase(base: ThemeBase): Result<ThemeBase> {
  const colors = [base.accent, base.onAccent, base.bg, base.fg, base.line];
  return colors.every(finite)
    ? ok(base)
    : fail('palette.bad-base', 'Jetons de thème : couleurs OKLCH finies attendues.');
}

function checkPalettes(palettes: Palettes): Result<Palettes> {
  const { accent, onAccent, categorical, sequential, diverging } = palettes;
  if (contrastRatio(onAccent, accent) < MIN_TEXT_CONTRAST) {
    return fail('palette.contrast-failed', "Le texte sur l'accent passe sous 4,5:1.", 'onAccent');
  }
  if (
    categorical.length < CATEGORICAL_COUNT ||
    minPairDistance(categorical) < MIN_CATEGORICAL_DELTA
  ) {
    return fail(
      'palette.cvd-failed',
      'Catégorielle : ΔE00 sous 10 selon la simulation.',
      'categorical',
    );
  }
  if (minStepDistance(sequential) < MIN_STEP_DELTA) {
    return fail(
      'palette.sequential-failed',
      'Séquentielle : pas voisins sous ΔE00 3.',
      'sequential',
    );
  }
  if (minStepDistance(diverging) < MIN_STEP_DELTA) {
    return fail('palette.diverging-failed', 'Divergente : pas voisins sous ΔE00 3.', 'diverging');
  }
  return ok(palettes);
}

/**
 * Dérive les trois palettes d'une teinte d'accent (degrés OKLCH) pour un thème. La clarté et le
 * chroma de l'accent viennent des jetons (`base`) : seule la teinte change. Refuse (erreur typée)
 * une teinte dont la dérivation échoue au contrôle.
 */
export function derivePalettes(hue: number, theme: Theme, base: ThemeBase): Result<Palettes> {
  if (!Number.isFinite(hue)) return fail('palette.bad-hue', 'La teinte doit être un nombre fini.');
  const checked = checkBase(base);
  if (!checked.ok) return checked;
  const h = normalizeHue(hue);
  return checkPalettes({
    theme,
    hue: h,
    accent: fitToGamut({ ...base.accent, h }),
    onAccent: base.onAccent,
    categorical: deriveCategorical(base, h),
    sequential: deriveSequential(base, h, theme),
    diverging: deriveDiverging(base, h, theme),
  });
}
