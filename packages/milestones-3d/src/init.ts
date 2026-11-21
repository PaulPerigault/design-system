import type { Env } from './env.ts';
import { MilestonesError, parseFault, reasonOf } from './error.ts';
import { startSession } from './instance.ts';
import type { InitOptions, MilestonesHandle } from './options.ts';
import { planOf, sceneInput } from './plan.ts';
import type { CanvasLike, RawScene } from './raw.ts';
import { createSession } from './session.ts';
import type { MilestonesData, Theme } from './types.ts';
import { validateData } from './validate.ts';
import { yieldToMain } from './yield.ts';

interface Deps {
  readonly options: InitOptions;
  readonly env: Env;
}

async function build(
  canvas: CanvasLike,
  valid: MilestonesData,
  theme: Theme,
  deps: Deps,
): Promise<RawScene> {
  const factory = await deps.env.loadScene().catch((cause: unknown) => {
    throw cause instanceof MilestonesError
      ? cause
      : new MilestonesError('load-failed', undefined, { cause });
  });
  await yieldToMain();
  factory.prepare?.(canvas);
  await yieldToMain();
  const scene = factory.create(canvas, sceneInput(valid, theme, deps.options.activeId ?? ''));
  await yieldToMain();
  return scene;
}

/**
 * Valide, charge le `.wasm`, crée la scène et branche l'instance. Un échec appelle
 * `onFallback(raison)`, libère tout ce qui a été créé, puis rejette avec une `MilestonesError`.
 */
export async function createInstance(
  canvas: CanvasLike,
  data: unknown,
  theme: Theme,
  deps: Deps,
): Promise<MilestonesHandle> {
  const { options, env } = deps;
  let scene: RawScene;
  let valid: MilestonesData;
  try {
    valid = validateData(data);
    scene = await build(canvas, valid, theme, deps);
  } catch (raised) {
    const error = parseFault(raised);
    options.onFallback?.(reasonOf(error));
    throw error;
  }
  const session = createSession(canvas, scene, options, env);
  try {
    return startSession(session, planOf(valid));
  } catch (raised) {
    session.fail('init-failed');
    throw parseFault(raised);
  }
}
