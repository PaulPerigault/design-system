// L'état d'une instance : scène, options, plateforme, registre de nettoyages, boucle de rendu.
import { createBag } from './bag.ts';
import type { Bag } from './bag.ts';
import type { Env } from './env.ts';
import { createLoop } from './loop.ts';
import { timed } from './phases.ts';
import { createWarmup } from './warmup.ts';
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
  /** Applique la dernière taille notée par l'observateur (posée par `watchSize`). */
  flushSize: () => void;
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

/**
 * Fonction de dessin de la boucle : d'abord le préchauffage (`warmup.ts`, qui commence par une image
 * d'attente sans rendu : le composant hôte se redimensionne juste après le démarrage, et redimensionner
 * le canvas juste après un rendu bloquait la tâche jusqu'à sa fin, audit #394), puis les images.
 * Seul le premier rendu est mesuré : les suivants ne doivent pas remplir le tampon de mesures.
 */
function drawer(
  scene: RawScene,
  canvas: CanvasLike,
  time: () => number,
  hooks: { drawn: () => void; flushSize: () => void },
): () => boolean {
  const ready = createWarmup(scene, canvas, { time, flushSize: hooks.flushSize });
  let first = true;
  return () => {
    if (!ready()) return true;
    hooks.flushSize();
    const more = first ? timed('first-frame', () => scene.frame(time())) : scene.frame(time());
    first = false;
    hooks.drawn();
    return more;
  };
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
  const hooks = { drawn: () => markDrawn(), flushSize: () => session.flushSize() };
  const loop = createLoop(drawer(scene, canvas, time, hooks), env.loop);
  let destroyed = false;
  const session: Session = {
    ...{ canvas, scene, options, env, loop, time, bag: createBag() },
    redraw: () => loop.request(),
    flushSize: () => {},
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
