// @paulperigault/milestones-3d : scène 3D de jalons en WebGL2, amélioration progressive d'une liste
// HTML. Aucun rendu en TypeScript : ce paquet valide, lit le thème, décide, charge le `.wasm`.
import { browserEnv } from './env.ts';
import { createInstance } from './init.ts';
import type { CanvasLike } from './raw.ts';
import type { InitOptions, MilestonesHandle } from './options.ts';
import type { Theme } from './types.ts';

export { parseColor } from './color.ts';
export { GOAL_ID } from './constants.ts';
export {
  canEnhance,
  enhanceBlocker,
  hasWebGL2,
  isWeakDevice,
  prefersReducedMotion,
} from './conditions.ts';
export type { EnhanceEnv } from './conditions.ts';
export { enhanceEnv } from './env.ts';
export { MilestonesError } from './error.ts';
export type { ErrorCode } from './error.ts';
export type { CanvasLike as CanvasTarget } from './raw.ts';
export { readTheme } from './theme.ts';
export type { InitOptions, MilestoneMark, MilestonesHandle } from './options.ts';
export type {
  Badge,
  FallbackReason,
  Goal,
  Milestone,
  MilestonesData,
  Status,
  Theme,
  ThemeColor,
  ThemeColorName,
} from './types.ts';
export { validateData } from './validate.ts';

/**
 * Affiche la scène sur `canvas`. Rend la poignée (`MilestonesHandle`), ou rejette
 * avec une `MilestonesError` après avoir appelé `options.onFallback(raison)`.
 */
export function init(
  canvas: CanvasLike,
  data: unknown,
  theme: Theme,
  options: InitOptions = {},
): Promise<MilestonesHandle> {
  return createInstance(canvas, data, theme, { options, env: browserEnv() });
}
