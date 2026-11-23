// Pointeur : inclinaison, survol (via `pick`) et sélection au clic ou au toucher. Écouteurs
// passifs, aucun `preventDefault` : le défilement natif n'est jamais bloqué (`touch-action: pan-y`
// côté CSS). Le canvas est `aria-hidden` : le clavier passe par le HTML.
import type { Bag } from './bag.ts';
import type { CanvasLike, RawScene } from './raw.ts';

interface PointerLike {
  readonly clientX: number;
  readonly clientY: number;
  readonly pointerType?: unknown;
}

const isPointer = (event: unknown): event is PointerLike =>
  typeof event === 'object' &&
  event !== null &&
  'clientX' in event &&
  typeof event.clientX === 'number' &&
  'clientY' in event &&
  typeof event.clientY === 'number';

export interface PointerHooks {
  /** Une image est due (inclinaison en cours). */
  redraw(): void;
  /** Médaille choisie. */
  select(id: string): void;
  /** Étape sous le pointeur, `null` s'il n'y en a pas. Appelé à chaque déplacement. */
  hover(id: string | null): void;
  /** Un geste de toucher a eu lieu : le moment de demander le gyroscope. */
  touchGesture(): void;
}

/** Étendue de l'espace normalisé : de -1 à 1. */
const NDC_SPAN = 2;
const PASSIVE = { passive: true } as const;

/** Position du pointeur en coordonnées normalisées : [-1, 1], y vers le haut. */
export function normalize(event: PointerLike, canvas: CanvasLike): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width > 0 ? rect.width : 1;
  const height = rect.height > 0 ? rect.height : 1;
  return {
    x: ((event.clientX - rect.left) / width) * NDC_SPAN - 1,
    y: 1 - ((event.clientY - rect.top) / height) * NDC_SPAN,
  };
}

export function bindPointer(canvas: CanvasLike, scene: RawScene, bag: Bag, hooks: PointerHooks) {
  bag.listen(
    canvas,
    'pointermove',
    (event) => {
      if (!isPointer(event)) return;
      const { x, y } = normalize(event, canvas);
      scene.pointerMove(x, y);
      hooks.hover(scene.pick(x, y) || null);
      hooks.redraw();
    },
    PASSIVE,
  );
  bag.listen(
    canvas,
    'pointerleave',
    () => {
      scene.pointerLeave();
      hooks.hover(null);
      hooks.redraw();
    },
    PASSIVE,
  );
  bag.listen(
    canvas,
    'pointerup',
    (event) => {
      if (!isPointer(event)) return;
      const { x, y } = normalize(event, canvas);
      const id = scene.pick(x, y);
      if (id !== '') hooks.select(id);
      if (event.pointerType === 'touch') hooks.touchGesture();
    },
    PASSIVE,
  );
}
