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
  /** Rappels `whenIdle` en attente. */
  readonly idles: Set<() => void>;
  /** Joue la première image planifiée ; vrai s'il y en avait une. */
  runFrame(): boolean;
  /** Joue les rappels de temps libre en attente. */
  runIdle(): void;
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
  const idles = new Set<() => void>();
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
    idles,
    clock: 1000,
    visible: true,
    loadError: undefined,
    runIdle() {
      for (const callback of [...idles]) {
        idles.delete(callback);
        callback();
      }
    },
    runFrame() {
      const [handle, callback] = [...frames][0] ?? [];
      if (handle === undefined || !callback) return false;
      frames.delete(handle);
      const drawn = (): number => scene.calls.filter((c) => c.startsWith('frame:')).length;
      const before = drawn();
      callback(h.clock);
      // Image d'attente de `startSession` : la vraie image est demandée par son rappel, on la joue.
      if (drawn() === before && frames.size > 0 && before === 0) h.runFrame();
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
      fetch: async () => ({ ok: true, blob: async () => new Blob([]) }),
      createImageBitmap: async () => ({ width: 64, height: 64, close: () => {} }),
      whenIdle: (callback) => {
        idles.add(callback);
        return () => void idles.delete(callback);
      },
      orientation: undefined,
      ...overrides,
    },
  };
  return h;
}
