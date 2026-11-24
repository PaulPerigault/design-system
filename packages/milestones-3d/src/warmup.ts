// Préchauffage du tracé (crates/pp-milestones-wasm/src/warm.rs) : sans carte graphique, le navigateur
// lit les pixels du canvas à chaque composition et attend le GPU logiciel, qui compile ses routines
// au premier usage (programmes, résolution de l'anticrénelage) : 60 à 90 ms de tâche longue à la
// première image (audit #394). Étapes, une par image de la boucle, la clôture du GPU n'étant jamais
// attendue en bloquant :
// 1. le canvas est caché depuis le début de `init` (`hideCanvas`) et le reste ici ;
// 2. une image d'attente, puis attente que le GPU ait rattrapé son retard (`idle`) : le
//    redimensionnement qui suit la mise en page du composant hôte est un appel synchrone, il
//    attendrait le tracé des tuiles de la page ; il est appliqué ici, avant le premier tracé ;
// 3. image d'essai canvas caché (programmes, supports, lecture asynchrone
//    d'un pixel qui force la résolution de l'anticrénelage) ;
// 4. clôture atteinte : le canvas est montré et l'image réelle peut être dessinée.
// Un refus ou un dépassement montrent le canvas sans attendre.
import { WARM_TIMEOUT_MS } from './constants.ts';
import type { CanvasLike, RawScene } from './raw.ts';

const HIDDEN = 'visibility';
const HIDE = 1;
const TRIAL = 3;

/**
 * Cache le canvas dès le début de `init` : un canvas WebGL visible est composé dès la première image
 * suivante, et sa toute première composition coûte 48 ms de GPU logiciel (audit #394).
 */
export function hideCanvas(canvas: CanvasLike): void {
  canvas.style?.setProperty(HIDDEN, 'hidden');
}

/** Appelée à chaque tick de la boucle ; rend vrai quand l'image réelle peut être dessinée. */
export function createWarmup(
  scene: RawScene,
  canvas: CanvasLike,
  hooks: { time: () => number; flushSize: () => void },
): () => boolean {
  const { time, flushSize } = hooks;
  let step = 0;
  let since = 0;
  let tried = false;
  const waited = time();
  const show = (): boolean => (canvas.style?.removeProperty(HIDDEN), true);
  const trial = (): boolean => {
    // Le GPU doit avoir rattrapé son retard (tracé des tuiles de la page) avant le premier appel
    // synchrone, le redimensionnement : il attendrait toute cette file.
    if (!scene.idle() && time() - waited < WARM_TIMEOUT_MS) return false;
    flushSize();
    tried = true;
    since = time();
    scene.warmFrame(since);
    return false;
  };
  const advance = (): boolean =>
    scene.warmed() || time() - since > WARM_TIMEOUT_MS ? show() : false;
  return () => {
    step += 1;
    if (step === HIDE) return (hideCanvas(canvas), false);
    if (step < TRIAL) return false;
    try {
      return tried ? advance() : trial();
    } catch {
      return show();
    }
  };
}
