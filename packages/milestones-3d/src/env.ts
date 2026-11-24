// Plateforme injectée : tout ce que l'instance demande au navigateur passe par `Env`, remplacée
// par des faux dans les tests (compteurs d'écouteurs, horloge, observateurs).
import type { ListenTarget } from './bag.ts';
import type { EnhanceEnv } from './conditions.ts';
import { hasWebGL2 } from './conditions.ts';
import { MilestonesError } from './error.ts';
import type { GyroEnv } from './gyroscope.ts';
import type { LoopDeps } from './loop.ts';
import type { CanvasLike, SceneFactory } from './raw.ts';
import { loadScene } from './runtime.ts';
import { readTheme } from './theme.ts';
import type { Theme } from './types.ts';

export interface Observer {
  observe(target: CanvasLike): void;
  disconnect(): void;
}
export interface MutationWatcher {
  observe(target: object, options: { attributes: true; attributeFilter: string[] }): void;
  disconnect(): void;
}
export interface MediaList extends ListenTarget {
  readonly matches: boolean;
}

export interface Env {
  loadScene(): Promise<SceneFactory>;
  readonly loop: LoopDeps;
  now(): number;
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
  devicePixelRatio(): number;
  /** `visible` : la page n'est pas masquée (onglet au premier plan). */
  pageVisible(): boolean;
  readonly document: ListenTarget;
  readonly window: ListenTarget;
  matchMedia(query: string): MediaList;
  readonly ResizeObserver: new (
    callback: (entries: readonly { readonly contentRect: DOMRectReadOnly }[]) => void,
  ) => Observer;
  readonly IntersectionObserver: new (
    callback: (entries: readonly { readonly isIntersecting: boolean }[]) => void,
  ) => Observer;
  readonly MutationObserver: new (callback: () => void) => MutationWatcher;
  readTheme(root: object): Theme;
  readonly orientation: GyroEnv['orientation'];
}

/** Les conditions de chargement, pour un navigateur : `visible` vient de l'observateur du composant. */
export function enhanceEnv(visible: boolean, win: Window = window): EnhanceEnv {
  return {
    hasWebGL2: () => hasWebGL2(() => win.document.createElement('canvas')),
    matchMedia: (query) => win.matchMedia(query),
    navigator: win.navigator,
    visible,
  };
}

export const browserEnv = (): Env => ({
  loadScene,
  loop: {
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (id) => cancelAnimationFrame(id),
  },
  now: () => performance.now(),
  setTimeout: (callback, ms) => window.setTimeout(callback, ms),
  clearTimeout: (id) => window.clearTimeout(id),
  devicePixelRatio: () => window.devicePixelRatio,
  pageVisible: () => document.visibilityState !== 'hidden',
  document,
  window,
  matchMedia: (query) => window.matchMedia(query),
  ResizeObserver,
  IntersectionObserver,
  MutationObserver,
  readTheme(root) {
    if (!(root instanceof Element)) throw new MilestonesError('invalid-theme', 'racine');
    return readTheme(root);
  },
  orientation: globalThis.DeviceOrientationEvent,
});
