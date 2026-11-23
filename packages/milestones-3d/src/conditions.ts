// Conditions de chargement de la 3D (ADR-0012, décision 5). Logique pure : tout vient de `env`.
//
// `prefers-reduced-motion` ne bloque plus la 3D (ADR-0013, décision 3) : la caméra saute (durées
// des jetons nulles). Le composant lit `prefersReducedMotion` pour adapter son pilotage.
//
// Une valeur absente n'est jamais une mesure : `deviceMemory` et `saveData` n'existent que sur
// Chromium, `hardwareConcurrency` peut manquer. Absente ou non positive, elle ne compte NI comme
// « appareil faible » NI comme « économie de données ».
import { WEAK_CORES, WEAK_MEMORY_GB } from './constants.ts';
import type { FallbackReason } from './types.ts';

export interface EnhanceEnv {
  /** WebGL2 est disponible (test sur un canvas jetable, voir `hasWebGL2`). */
  hasWebGL2(): boolean;
  matchMedia(query: string): { readonly matches: boolean };
  readonly navigator: {
    readonly hardwareConcurrency?: number | undefined;
    readonly deviceMemory?: number | undefined;
    readonly connection?: { readonly saveData?: boolean | undefined } | undefined;
  };
  /** La section est visible ou proche de l'être (observateur d'intersection de l'appelant). */
  readonly visible: boolean;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Vrai si la personne demande moins de mouvement : pilotage par étapes, sans animation. */
export const prefersReducedMotion = (env: Pick<EnhanceEnv, 'matchMedia'>): boolean =>
  env.matchMedia(REDUCED_MOTION).matches;

/** Vrai si la valeur est une mesure (nombre fini et positif). */
const measured = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export function isWeakDevice(navigator: EnhanceEnv['navigator']): boolean {
  const { hardwareConcurrency: cores, deviceMemory: memory } = navigator;
  return (measured(cores) && cores <= WEAK_CORES) || (measured(memory) && memory <= WEAK_MEMORY_GB);
}

/**
 * La première condition qui empêche la 3D, ou `null` si elle est admise. Ordre : les contrôles
 * sans coût d'abord, la création d'un contexte WebGL en dernier.
 */
export function enhanceBlocker(env: EnhanceEnv): FallbackReason | null {
  if (env.navigator.connection?.saveData === true) return 'save-data';
  if (isWeakDevice(env.navigator)) return 'weak-device';
  if (!env.visible) return 'hidden';
  return env.hasWebGL2() ? null : 'no-webgl2';
}

/** Vrai si toutes les conditions de l'ADR tiennent. */
export const canEnhance = (env: EnhanceEnv): boolean => enhanceBlocker(env) === null;

export interface CanvasLike {
  getContext(id: 'webgl2'): { getExtension(name: string): unknown } | null;
}

/** WebGL2 sur un canvas jetable, rendu au navigateur aussitôt (le nombre de contextes est plafonné). */
export function hasWebGL2(createCanvas: () => CanvasLike): boolean {
  try {
    const context = createCanvas().getContext('webgl2');
    const lose = context?.getExtension('WEBGL_lose_context');
    if (typeof lose === 'object' && lose !== null && 'loseContext' in lose) {
      if (typeof lose.loseContext === 'function') lose.loseContext();
    }
    return context !== null && context !== undefined;
  } catch {
    return false;
  }
}
