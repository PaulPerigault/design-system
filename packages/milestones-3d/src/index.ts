// @paulperigault/milestones-3d : scène 3D de jalons en WebGL2, amélioration progressive d'une liste
// HTML. Aucun rendu en TypeScript : ce paquet valide, lit le thème, décide, charge le `.wasm`.
import { browserEnv } from './env.ts';
import { createInstance } from './init.ts';
import type { CanvasLike } from './raw.ts';
import type { InitOptions, MilestonesHandle, Theme } from './types.ts';

export { parseColor } from './color.ts';
export { canEnhance, enhanceBlocker, hasWebGL2, isWeakDevice } from './conditions.ts';
export type { EnhanceEnv } from './conditions.ts';
export { enhanceEnv } from './env.ts';
export { MilestonesError } from './error.ts';
export type { ErrorCode } from './error.ts';
export type { CanvasLike as CanvasTarget } from './raw.ts';
export { readTheme } from './theme.ts';
export { EMBLEM_KEYS } from './types.ts';
export type {
  EmblemKey,
  FallbackReason,
  Goal,
  InitOptions,
  Milestone,
  MilestonesData,
  MilestonesHandle,
  Status,
  Theme,
  ThemeColor,
} from './types.ts';
export { validateData } from './validate.ts';

/**
 * Affiche la scène sur `canvas`. Rend la poignée `{ destroy, setTheme, setActive }`, ou rejette
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
