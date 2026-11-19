// Pointeur : inclinaison au survol ou au glissé, sélection au clic ou au toucher. Le canvas est
// `aria-hidden` : la sélection au clavier passe par la liste HTML (`setActive`).
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
  /** Jalon choisi sur le canvas. */
  select(id: string): void;
  /** Un geste de toucher a eu lieu : le moment de demander le gyroscope. */
  touchGesture(): void;
  now(): number;
}

/** Étendue de l'espace normalisé : de -1 à 1. */
const NDC_SPAN = 2;

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
  bag.listen(canvas, 'pointermove', (event) => {
    if (!isPointer(event)) return;
    const { x, y } = normalize(event, canvas);
    scene.pointerMove(x, y);
    hooks.redraw();
  });
  bag.listen(canvas, 'pointerleave', () => {
    scene.pointerLeave();
    hooks.redraw();
  });
  bag.listen(canvas, 'pointerup', (event) => {
    if (!isPointer(event)) return;
    const { x, y } = normalize(event, canvas);
    const id = scene.pick(x, y, hooks.now());
    if (id !== undefined) hooks.select(id);
    if (event.pointerType === 'touch') hooks.touchGesture();
  });
}
