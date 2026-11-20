// Taille du canvas : résolution interne suivant la taille CSS (posée par la feuille de style, jamais
// par un attribut `style`), plafonnée par `dprMax`. Un `ResizeObserver` redessine au changement.
import type { Bag } from './bag.ts';
import type { Env } from './env.ts';
import type { CanvasLike, RawScene } from './raw.ts';

export interface SurfaceDeps {
  readonly canvas: CanvasLike;
  readonly scene: RawScene;
  readonly env: Env;
  readonly bag: Bag;
  readonly dprMax: number;
}

/** Pixels de l'appareil pour une taille CSS : au moins un, rapport plafonné à `dprMax`. */
export function devicePixels(css: number, ratio: number, dprMax: number): number {
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return Math.max(1, Math.round(css * Math.min(safeRatio, dprMax)));
}

/** Applique la taille courante, puis la suit. `redraw` est appelé après chaque changement. */
export function watchSize({ canvas, scene, env, bag, dprMax }: SurfaceDeps, redraw: () => void) {
  const apply = (width: number, height: number): void => {
    if (!(width > 0 && height > 0)) return;
    const ratio = env.devicePixelRatio();
    scene.resize(devicePixels(width, ratio, dprMax), devicePixels(height, ratio, dprMax));
    redraw();
  };
  apply(canvas.clientWidth, canvas.clientHeight);
  const observer = new env.ResizeObserver((entries) => {
    const last = entries.at(-1);
    if (last) apply(last.contentRect.width, last.contentRect.height);
  });
  observer.observe(canvas);
  bag.add(() => observer.disconnect());
}
