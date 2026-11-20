import type { Env } from './env.ts';
import { MilestonesError, parseFault, reasonOf } from './error.ts';
import { startSession } from './instance.ts';
import type { CanvasLike, RawScene, SceneInput } from './raw.ts';
import { themeToArray } from './raw-theme.ts';
import { createSession } from './session.ts';
import type { InitOptions, MilestonesData, MilestonesHandle, Theme } from './types.ts';
import { validateData } from './validate.ts';
import { yieldToMain } from './yield.ts';

interface Deps {
  readonly options: InitOptions;
  readonly env: Env;
}

function input(data: MilestonesData, theme: Theme, active: string | undefined): SceneInput {
  const { milestones } = data;
  return {
    ids: milestones.map((m) => m.id),
    statuses: milestones.map((m) => m.status),
    emblems: milestones.map((m) => m.emblem ?? ''),
    goal: data.goal !== undefined,
    theme: themeToArray(theme),
    active: active ?? '',
  };
}

async function build(
  canvas: CanvasLike,
  data: unknown,
  theme: Theme,
  deps: Deps,
): Promise<RawScene> {
  const valid = validateData(data);
  const factory = await deps.env.loadScene().catch((cause: unknown) => {
    throw cause instanceof MilestonesError
      ? cause
      : new MilestonesError('load-failed', undefined, { cause });
  });
  await yieldToMain();
  factory.prepare?.(canvas);
  await yieldToMain();
  const scene = factory.create(canvas, input(valid, theme, deps.options.activeId));
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
  try {
    scene = await build(canvas, data, theme, deps);
  } catch (raised) {
    const error = parseFault(raised);
    options.onFallback?.(reasonOf(error));
    throw error;
  }
  const session = createSession(canvas, scene, options, env);
  try {
    return startSession(session);
  } catch (raised) {
    session.fail('init-failed');
    throw parseFault(raised);
  }
}
