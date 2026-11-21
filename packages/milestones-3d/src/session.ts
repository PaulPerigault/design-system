// L'état d'une instance : scène, options, plateforme, registre de nettoyages, boucle de rendu.
import { createBag } from './bag.ts';
import type { Bag } from './bag.ts';
import type { Env } from './env.ts';
import { createLoop } from './loop.ts';
import type { Loop } from './loop.ts';
import type { CanvasLike, RawScene } from './raw.ts';
import { themeToArray } from './raw-theme.ts';
import type { InitOptions } from './options.ts';
import type { FallbackReason, Theme } from './types.ts';

export interface Session {
  readonly canvas: CanvasLike;
  readonly scene: RawScene;
  readonly options: InitOptions;
  readonly env: Env;
  readonly bag: Bag;
  readonly loop: Loop;
  /** Millisecondes depuis la création de la scène : l'horloge de `pp-milestones`. */
  time(): number;
  /** Demande une image. */
  redraw(): void;
  /** Résolue quand la première image a été dessinée (jamais si la scène reste hors écran). */
  readonly firstFrame: Promise<void>;
  isDestroyed(): boolean;
  /** Idempotent : retire écouteurs et observateurs, arrête la boucle, libère GL et contexte. */
  destroy(): void;
  /** Repli définitif : prévient l'appelant puis détruit. */
  fail(reason: FallbackReason): void;
  apply(theme: Theme): void;
}

function release({ bag, loop, scene }: Session): void {
  bag.disposeAll();
  loop.stop();
  try {
    scene.destroy();
  } finally {
    scene.free();
  }
}

export function createSession(
  canvas: CanvasLike,
  scene: RawScene,
  options: InitOptions,
  env: Env,
): Session {
  const start = env.now();
  const time = (): number => env.now() - start;
  let markDrawn = (): void => {};
  const firstFrame = new Promise<void>((resolve) => void (markDrawn = resolve));
  const loop = createLoop(() => {
    const more = scene.frame(time());
    markDrawn();
    return more;
  }, env.loop);
  let destroyed = false;
  const session: Session = {
    ...{ canvas, scene, options, env, loop, time, bag: createBag() },
    redraw: () => loop.request(),
    firstFrame,
    isDestroyed: () => destroyed,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      release(session);
    },
    fail(reason) {
      options.onFallback?.(reason);
      session.destroy();
    },
    apply(theme) {
      scene.setTheme(themeToArray(theme));
      loop.request();
    },
  };
  return session;
}
