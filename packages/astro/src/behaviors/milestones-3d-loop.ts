/**
 * Boucle d'images à la demande : aucune image planifiée au repos. `kick` la relance (défilement,
 * commande) ; elle tourne tant que `tick` rend vrai (quelque chose bouge), puis encore quelques
 * images : la scène glisse vers sa cible après la dernière commande.
 */
import type { Env } from './milestones-3d-types';

/** Images stables avant de s'arrêter. */
export const SETTLE_FRAMES = 8;
const NONE = 0;

export interface Loop {
  kick(): void;
  stop(): void;
}

export function createLoop(env: Env, tick: () => boolean): Loop {
  let cancel: (() => void) | null = null;
  let left = NONE;
  const run = (): void => {
    cancel = null;
    left = tick() ? SETTLE_FRAMES : left - 1;
    if (left > NONE) cancel = env.frame(run);
  };
  return {
    kick() {
      left = SETTLE_FRAMES;
      cancel ??= env.frame(run);
    },
    stop() {
      cancel?.();
      cancel = null;
      left = NONE;
    },
  };
}
