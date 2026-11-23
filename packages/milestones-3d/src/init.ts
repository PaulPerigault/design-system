import type { Env } from './env.ts';
import { MilestonesError, parseFault, reasonOf } from './error.ts';
import { initGpu } from './gpu-steps.ts';
import { startSession } from './instance.ts';
import type { InitOptions, MilestonesHandle } from './options.ts';
import { phaseEnd, phaseStart, timed } from './phases.ts';
import { planOf, sceneInput } from './plan.ts';
import type { CanvasLike, RawScene } from './raw.ts';
import { createSession } from './session.ts';
import type { MilestonesData, Theme } from './types.ts';
import { validateData } from './validate.ts';
import { hideCanvas } from './warmup.ts';
import { yieldToFrame, yieldToMain } from './yield.ts';

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
  const loading = phaseStart();
  const factory = await deps.env.loadScene().catch((cause: unknown) => {
    throw cause instanceof MilestonesError
      ? cause
      : new MilestonesError('load-failed', undefined, { cause });
  });
  phaseEnd('load-wasm', loading);
  await yieldToMain();
  timed('prepare-context', () => factory.prepare?.(canvas));
  await yieldToMain();
  const input = sceneInput(valid, theme, deps.options.activeId ?? '');
  const scene = timed('create-scene', () => factory.create(canvas, input));
  await yieldToMain();
  try {
    await initGpu(scene);
  } catch (raised) {
    scene.destroy();
    scene.free();
    throw raised;
  }
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
  hideCanvas(canvas);
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
    const handle = startSession(session, planOf(valid));
    await yieldToFrame();
    // Perte de contexte pendant l'attente : le repli est déjà fait, le composant ne doit pas suivre.
    if (session.isDestroyed()) throw new MilestonesError('gl-resource', 'scène détruite en cours');
    return handle;
  } catch (raised) {
    if (!session.isDestroyed()) session.fail('init-failed');
    throw parseFault(raised);
  }
}
