// Taille du canvas : résolution interne suivant la taille CSS (posée par la feuille de style, jamais
// par un attribut `style`), plafonnée par `dprMax`. Un `ResizeObserver` redessine au changement.
import type { Bag } from './bag.ts';
import { COMPACT_MAX_CSS_PX } from './constants.ts';
import type { Env } from './env.ts';
import { timed } from './phases.ts';
import type { CanvasLike, RawScene } from './raw.ts';

export interface SurfaceDeps {
  readonly canvas: CanvasLike;
  readonly scene: RawScene;
  readonly env: Env;
  readonly bag: Bag;
  readonly dprMax: number;
}

const MEASURED_RESIZES = 2;

/** Pixels de l'appareil pour une taille CSS : au moins un, rapport plafonné à `dprMax`. */
export function devicePixels(css: number, ratio: number, dprMax: number): number {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return Math.max(1, Math.round(css * Math.min(safeRatio, dprMax)));
}

/**
 * Applique la taille courante, puis la suit ; rend `flush`, qui applique la dernière taille notée.
 * `redraw` est appelé après chaque changement. Une taille
 * déjà appliquée n'est pas renvoyée à la scène : poser `width` ou `height` d'un canvas WebGL réalloue
 * toujours son tampon, même à valeur égale, et le premier rappel du `ResizeObserver` (émis à
 * l'observation) refaisait cette allocation (80 ms de tâche, processeur ralenti 4 fois, audit #394).
 */
export function watchSize(
  { canvas, scene, env, bag, dprMax }: SurfaceDeps,
  redraw: () => void,
): () => void {
  let applied = '';
  let sizes = 0;
  const apply = (width: number, height: number): void => {
    if (!(width > 0 && height > 0)) return;
    const ratio = env.devicePixelRatio();
    const [w, h] = [devicePixels(width, ratio, dprMax), devicePixels(height, ratio, dprMax)];
    if (`${w}x${h}` === applied) return;
    applied = `${w}x${h}`;
    scene.setCompact(width < COMPACT_MAX_CSS_PX);
    // Les deux premiers redimensionnements sont mesurés (tampon de mesures borné).
    if (sizes < MEASURED_RESIZES) timed('resize', () => scene.resize(w, h));
    else scene.resize(w, h);
    sizes += 1;
    redraw();
  };
  apply(canvas.clientWidth, canvas.clientHeight);
  // Le rappel du `ResizeObserver` ne fait que noter la taille : la boucle l'applique à son image
  // (`flush`), quand le GPU a rattrapé son retard. Redimensionner un canvas WebGL est un appel
  // synchrone qui attend tout ce que le GPU logiciel a en file, dont le tracé des tuiles de la page
  // après le changement de mise en page du composant hôte (160 à 450 ms, audit #394).
  let next: { width: number; height: number } | undefined;
  const flush = (): void => {
    const size = next;
    next = undefined;
    if (size) apply(size.width, size.height);
  };
  const observer = new env.ResizeObserver((entries) => {
    const last = entries.at(-1);
    if (!last) return;
    next = { width: last.contentRect.width, height: last.contentRect.height };
    redraw();
  });
  observer.observe(canvas);
  bag.add(() => observer.disconnect());
  return flush;
}
