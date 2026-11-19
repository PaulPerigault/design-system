// Faux navigateur pour les tests d'instance : horloge et planificateur manuels, scène simulée.
// Aucun DOM, aucune assertion de type.
import type { Env, MediaList } from '../src/env.ts';
import type { CanvasLike, SceneFactory, SceneInput } from '../src/raw.ts';
import type { Theme } from '../src/types.ts';
import { FakeCanvas, FakeObserver, FakeTarget } from './support-dom.ts';
import { FakeScene } from './support-scene.ts';

export { FakeCanvas, FakeObserver, FakeScene, FakeTarget };

export interface Harness {
  readonly env: Env;
  readonly scene: FakeScene;
  readonly canvas: FakeCanvas;
  readonly document: FakeTarget;
  readonly window: FakeTarget;
  readonly media: FakeTarget & MediaList;
  readonly created: SceneInput[];
  readonly timers: Map<number, { callback: () => void; ms: number }>;
  readonly frames: Map<number, (t: number) => void>;
  readonly readThemes: Theme[];
  clock: number;
  visible: boolean;
  loadError: Error | undefined;
  /** Joue la première image planifiée ; vrai s'il y en avait une. */
  runFrame(): boolean;
}

export function createHarness(theme: Theme, overrides: Partial<Env> = {}): Harness {
  FakeObserver.all = [];
  const scene = new FakeScene();
  const media = Object.assign(new FakeTarget(), { matches: false });
  const [document, window] = [new FakeTarget(), new FakeTarget()];
  const timers = new Map<number, { callback: () => void; ms: number }>();
  const frames = new Map<number, (t: number) => void>();
  const created: SceneInput[] = [];
  const readThemes: Theme[] = [];
  let next = 1;
  const id = (): number => (next += 1);
  const h: Harness = {
    scene,
    canvas: new FakeCanvas(),
    document,
    window,
    media,
    created,
    timers,
    frames,
    readThemes,
    clock: 1000,
    visible: true,
    loadError: undefined,
    runFrame() {
      const [handle, callback] = [...frames][0] ?? [];
      if (handle === undefined || !callback) return false;
      frames.delete(handle);
      callback(h.clock);
      return true;
    },
    env: {
      loadScene: async (): Promise<SceneFactory> => {
        if (h.loadError) throw h.loadError;
        return {
          create: (_canvas: CanvasLike, input: SceneInput) => (created.push(input), scene),
        };
      },
      loop: {
        requestFrame: (callback) => {
          const handle = id();
          frames.set(handle, callback);
          return handle;
        },
        cancelFrame: (handle) => void frames.delete(handle),
      },
      now: () => h.clock,
      setTimeout: (callback, ms) => {
        const handle = id();
        timers.set(handle, { callback, ms });
        return handle;
      },
      clearTimeout: (handle) => void timers.delete(handle),
      devicePixelRatio: () => 3,
      pageVisible: () => h.visible,
      document,
      window,
      matchMedia: () => media,
      ResizeObserver: FakeObserver,
      IntersectionObserver: FakeObserver,
      MutationObserver: FakeObserver,
      readTheme: () => (readThemes.push(theme), theme),
      orientation: undefined,
      ...overrides,
    },
  };
  return h;
}
