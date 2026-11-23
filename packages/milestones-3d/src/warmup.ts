// Préchauffage du tracé (crates/pp-milestones-wasm/src/warm.rs) : sans carte graphique, le navigateur
// lit les pixels du canvas à chaque composition et attend le GPU logiciel, qui compile ses routines
// au premier usage (programmes, résolution de l'anticrénelage) : 60 à 90 ms de tâche longue à la
// première image (audit #394). Étapes, une par image de la boucle, la clôture du GPU n'étant jamais
// attendue en bloquant :
// 1. le canvas est caché (il doit avoir quitté la composition avant d'être sali) ;
// 2. image d'essai canvas caché (programmes, faces avec texture de remplacement, lecture asynchrone
//    d'un pixel qui force la résolution de l'anticrénelage) ;
// 3. clôture atteinte : le canvas est montré et l'image réelle peut être dessinée.
// Un refus ou un dépassement montrent le canvas sans attendre.
import { WARM_TIMEOUT_MS } from './constants.ts';
import type { CanvasLike, RawScene } from './raw.ts';

const HIDDEN = 'visibility';
const HIDE = 1;
const TRIAL = 2;

/** Appelée à chaque tick de la boucle ; rend vrai quand l'image réelle peut être dessinée. */
export function createWarmup(
  scene: RawScene,
  canvas: CanvasLike,
  time: () => number,
): () => boolean {
  let step = 0;
  let since = 0;
  const show = (): boolean => (canvas.style?.removeProperty(HIDDEN), true);
  const trial = (): boolean => {
    since = time();
    scene.warmFrame(since);
    return false;
  };
  const advance = (): boolean =>
    scene.warmed() || time() - since > WARM_TIMEOUT_MS ? show() : false;
  return () => {
    step += 1;
    if (step === HIDE) return (canvas.style?.setProperty(HIDDEN, 'hidden'), false);
    try {
      return step === TRIAL ? trial() : advance();
    } catch {
      return show();
    }
  };
}
