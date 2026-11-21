import type { Env } from '../src/behaviors/milestones-3d';

/** Plateforme factice : images, défilement et préférence de mouvement pilotés à la main. */
export interface FakeEnv extends Env {
  scrolled: { top: number; smooth: boolean }[];
  listeners: number;
  setScroll(y: number): void;
  setReduced(value: boolean): void;
  /** Exécute les images planifiées (au plus `max`). */
  flush(max?: number): number;
}

export function fakeEnv(reduced = false, viewport = 800): FakeEnv {
  let y = 0;
  let isReduced = reduced;
  let queue: (() => void)[] = [];
  const scrollListeners = new Set<() => void>();
  const motionListeners = new Set<() => void>();
  const env: FakeEnv = {
    scrolled: [],
    get listeners() {
      return scrollListeners.size;
    },
    reducedMotion: () => ({
      matches: isReduced,
      subscribe: (callback) => {
        motionListeners.add(callback);
        return () => motionListeners.delete(callback);
      },
    }),
    scrollY: () => y,
    viewportHeight: () => viewport,
    scrollTo: (top, smooth) => void env.scrolled.push({ top, smooth }),
    onScroll: (callback) => {
      scrollListeners.add(callback);
      return () => scrollListeners.delete(callback);
    },
    frame: (callback) => {
      queue.push(callback);
      return () => {
        queue = queue.filter((c) => c !== callback);
      };
    },
    setScroll(value) {
      y = value;
      scrollListeners.forEach((listener) => listener());
    },
    setReduced(value) {
      isReduced = value;
      motionListeners.forEach((listener) => listener());
    },
    flush(max = 50) {
      let count = 0;
      while (queue.length > 0 && count < max) {
        const run = queue;
        queue = [];
        run.forEach((callback) => callback());
        count += 1;
      }
      return count;
    },
  };
  return env;
}

/** Piste de hauteur `height`, dont le haut est à `trackTop - scrollY` de l'écran. */
export function placeTrack(host: HTMLElement, env: FakeEnv, height: number, trackTop = 0): void {
  const track = host.querySelector('[data-pp-track]') as HTMLElement;
  track.getBoundingClientRect = () =>
    ({ top: trackTop - env.scrollY(), height, bottom: 0, left: 0, right: 0, width: 0 }) as DOMRect;
}
