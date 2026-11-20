/**
 * Quand charger la scène 3D de Milestones3D (ADR-0012, décision 5). Deux temps :
 * 1. `blockedEarly` écarte, sans rien télécharger, les visiteurs qui ne veulent pas de mouvement
 *    ou d'économie de données (le paquet 3D tranche ensuite le reste : WebGL2, appareil faible).
 * 2. `whenReady` attend que la section approche du viewport (marge d'observation : le chargement
 *    démarre avant l'entrée à l'écran). Déjà visible au chargement, il attend le premier geste ou
 *    l'inactivité du navigateur, pour ne pas toucher au LCP : le contenu classique en est l'élément.
 */

/** Marge d'observation : la section est « proche » à cette distance du viewport. */
export const LOAD_MARGIN = '200px 0px';
/** Délai maximal d'attente de l'inactivité du navigateur. */
export const IDLE_TIMEOUT_MS = 2000;
export const GESTURES: readonly string[] = ['pointerdown', 'keydown', 'touchstart', 'wheel'];

export type EarlyReason = 'reduced-motion' | 'save-data';

/** Plateforme du temps d'attente, injectée pour les tests. */
export interface GateEnv {
  observe(
    target: Element,
    onEntry: (entry: { isIntersecting: boolean; top: number; bottom: number }) => void,
  ): () => void;
  viewportHeight(): number;
  /** Écoute les gestes ; rend la fonction qui retire les écouteurs. */
  onGesture(callback: () => void): () => void;
  /** Appelle `callback` à l'inactivité ; rend la fonction qui annule. */
  onIdle(callback: () => void): () => void;
}

export interface EarlyEnv {
  matchMedia(query: string): { matches: boolean };
  navigator: { connection?: { saveData?: boolean } | undefined };
}

export function blockedEarly(env: EarlyEnv): EarlyReason | null {
  if (env.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'reduced-motion';
  return env.navigator.connection?.saveData === true ? 'save-data' : null;
}

/** La section touche le viewport (par opposition à la marge d'observation seule). */
export const inFirstScreen = (rect: { top: number; bottom: number }, height: number): boolean =>
  rect.bottom > 0 && rect.top < height;

/** Résout avec « déjà à l'écran » dès que la section est proche du viewport. */
function whenNear(host: Element, env: GateEnv): Promise<boolean> {
  return new Promise((resolve) => {
    const stop = env.observe(host, (entry) => {
      if (!entry.isIntersecting) return;
      stop();
      resolve(inFirstScreen(entry, env.viewportHeight()));
    });
  });
}

/** Résout au premier geste ou à l'inactivité, selon le premier des deux. */
function whenSettled(env: GateEnv): Promise<void> {
  return new Promise((resolve) => {
    const stops: (() => void)[] = [];
    const done = (): void => {
      stops.forEach((stop) => stop());
      resolve();
    };
    stops.push(env.onGesture(done), env.onIdle(done));
  });
}

export async function whenReady(host: Element, env: GateEnv): Promise<void> {
  if (await whenNear(host, env)) await whenSettled(env);
}

type Win = Window & typeof globalThis;

const idle = (win: Win, callback: () => void): (() => void) => {
  if (typeof win.requestIdleCallback !== 'function') {
    const id = win.setTimeout(callback, IDLE_TIMEOUT_MS);
    return () => win.clearTimeout(id);
  }
  const id = win.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
  return () => win.cancelIdleCallback(id);
};

export const browserGate = (win: Win = window): GateEnv => ({
  observe(target, onEntry) {
    const observer = new win.IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          onEntry({
            isIntersecting: entry.isIntersecting,
            top: entry.boundingClientRect.top,
            bottom: entry.boundingClientRect.bottom,
          }),
        ),
      { rootMargin: LOAD_MARGIN },
    );
    observer.observe(target);
    return () => observer.disconnect();
  },
  viewportHeight: () => win.innerHeight,
  onGesture(callback) {
    const options = { once: true, passive: true };
    GESTURES.forEach((name) => win.addEventListener(name, callback, options));
    return () => GESTURES.forEach((name) => win.removeEventListener(name, callback));
  },
  onIdle: (callback) => idle(win, callback),
});
