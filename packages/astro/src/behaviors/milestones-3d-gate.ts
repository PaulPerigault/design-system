/**
 * Quand charger la scène 3D de Milestones3D (ADR-0012, décision 5). Deux temps :
 * 1. `blockedEarly` écarte, sans rien télécharger, les visiteurs en économie de données (le paquet
 *    3D tranche ensuite le reste : WebGL2, appareil faible). `prefers-reduced-motion` ne bloque plus
 *    (ADR-0013) : il change le mode de pilotage, voir `milestones-3d-pilot.ts`.
 * 2. `whenReady` attend que la section approche du viewport (marge d'observation : le chargement
 *    démarre avant l'entrée à l'écran). Déjà visible au chargement, il attend le premier geste
 *    (clic, toucher, touche) : insérer la scène sans geste décalerait la liste déjà affichée (CLS de
 *    0,19 mesuré par l'audit #366 avec l'inactivité du navigateur) et toucherait au LCP. Un décalage
 *    qui suit un geste discret n'est pas compté par la mesure du CLS.
 */

/** Marge d'observation : la section est « proche » à cette distance du viewport. */
export const LOAD_MARGIN = '200px 0px';
/** Gestes discrets : ni le défilement ni la molette (leur décalage serait compté). */
export const GESTURES: readonly string[] = ['pointerdown', 'keydown'];

export type EarlyReason = 'save-data';

/** Plateforme du temps d'attente, injectée pour les tests. */
export interface GateEnv {
  observe(
    target: Element,
    onEntry: (entry: { isIntersecting: boolean; top: number; bottom: number }) => void,
  ): () => void;
  viewportHeight(): number;
  /** Écoute les gestes ; rend la fonction qui retire les écouteurs. */
  onGesture(callback: () => void): () => void;
}

export interface EarlyEnv {
  navigator: { connection?: { saveData?: boolean } | undefined };
}

export function blockedEarly(env: EarlyEnv): EarlyReason | null {
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

/** Résout au premier geste discret. */
function whenGesture(env: GateEnv): Promise<void> {
  return new Promise((resolve) => {
    const stop = env.onGesture(() => {
      stop();
      resolve();
    });
  });
}

export async function whenReady(host: Element, env: GateEnv): Promise<void> {
  if (await whenNear(host, env)) await whenGesture(env);
}

type Win = Window & typeof globalThis;

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
});
