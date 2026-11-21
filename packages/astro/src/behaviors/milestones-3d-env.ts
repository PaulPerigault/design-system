/** Plateforme réelle du pilotage : défilement, image, mouvement réduit (voir `Env`). */
import type { Env } from './milestones-3d-types';

type Win = Window & typeof globalThis;
const REDUCED = '(prefers-reduced-motion: reduce)';

export function browserEnv(win: Win = window): Env {
  return {
    reducedMotion() {
      const query = win.matchMedia(REDUCED);
      return {
        matches: query.matches,
        subscribe(callback) {
          query.addEventListener('change', callback);
          return () => query.removeEventListener('change', callback);
        },
      };
    },
    scrollY: () => win.scrollY,
    viewportHeight: () => win.innerHeight,
    scrollTo: (top, smooth) => win.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' }),
    onScroll(callback) {
      win.addEventListener('scroll', callback, { passive: true });
      return () => win.removeEventListener('scroll', callback);
    },
    frame(callback) {
      const handle = win.requestAnimationFrame(callback);
      return () => win.cancelAnimationFrame(handle);
    },
  };
}
