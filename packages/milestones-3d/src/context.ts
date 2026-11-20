// Perte et restauration du contexte WebGL (MDN, Khronos « Handling Lost Context »). Sans
// `preventDefault()` sur `webglcontextlost`, le contexte n'est pas marqué restaurable.
import type { Bag } from './bag.ts';
import { CONTEXT_RESTORE_TIMEOUT_MS } from './constants.ts';
import type { Env } from './env.ts';
import type { CanvasLike, RawScene } from './raw.ts';
import type { FallbackReason } from './types.ts';

export interface ContextDeps {
  readonly canvas: CanvasLike;
  readonly scene: RawScene;
  readonly env: Env;
  readonly bag: Bag;
  /** Une image est due (après une restauration). */
  redraw(): void;
  /** Repli définitif : la restauration n'est pas venue, ou a échoué. */
  fail(reason: FallbackReason): void;
}

function preventDefault(event: unknown): void {
  if (typeof event === 'object' && event !== null && 'preventDefault' in event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
}

export function watchContext({ canvas, scene, env, bag, redraw, fail }: ContextDeps): void {
  let timer: number | undefined;
  const clear = (): void => {
    if (timer !== undefined) env.clearTimeout(timer);
    timer = undefined;
  };
  bag.listen(canvas, 'webglcontextlost', (event) => {
    preventDefault(event);
    scene.contextLost();
    clear();
    timer = env.setTimeout(() => fail('context-lost'), CONTEXT_RESTORE_TIMEOUT_MS);
  });
  bag.listen(canvas, 'webglcontextrestored', () => {
    clear();
    try {
      scene.contextRestored();
      redraw();
    } catch {
      fail('context-lost');
    }
  });
  bag.add(clear);
}
