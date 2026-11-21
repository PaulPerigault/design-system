// La poignée publique. Chaque commande relaie vers la scène puis demande une image : la scène
// n'agit qu'à la prochaine `frame`, avec l'horloge de frame. Après `destroy()`, rien ne se passe.
import { MilestonesError, parseFault } from './error.ts';
import type { MilestoneMark, MilestonesHandle } from './options.ts';
import type { Plan } from './plan.ts';
import type { Session } from './session.ts';

/** Nombres par étape dans le tableau de `project()` : x, y, rayon, visibilité. */
const STRIDE = 4;

function marks(values: Float32Array, ids: readonly string[]): MilestoneMark[] {
  return ids.map((id, index) => {
    const at = index * STRIDE;
    const [x = 0, y = 0, scale = 0, visible = 0] = values.subarray(at, at + STRIDE);
    return { id, x, y, scale, visible: visible === 1 };
  });
}

export function createHandle(s: Session, plan: Plan): MilestonesHandle {
  const { scene } = s;
  const command =
    <A extends unknown[]>(run: (...args: A) => void) =>
    (...args: A): void => {
      if (s.isDestroyed()) return;
      try {
        run(...args);
      } catch (raised) {
        throw parseFault(raised);
      }
      s.redraw();
    };
  return {
    destroy: s.destroy,
    setTheme: (theme) => {
      if (!s.isDestroyed()) s.apply(theme);
    },
    setActive: command((id: string) => {
      if (!scene.setActive(id)) throw new MilestonesError('unknown-id', id);
    }),
    setProgress: command((progress: number) => scene.setProgress(progress)),
    setHover: command((id: string | null) => scene.setHover(id ?? '')),
    progressOf: (id) => (s.isDestroyed() ? -1 : scene.progressOf(id)),
    project: () => (s.isDestroyed() ? [] : marks(scene.project(), plan.ids)),
  };
}
