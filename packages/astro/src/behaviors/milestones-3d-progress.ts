/**
 * Calculs purs du pilotage au défilement (ADR-0013, décision 3) : fraction de défilement dans la
 * piste, étape la plus proche, voisinage d'une étape, position de page d'un jalon. Aucun accès au
 * DOM : tout est testé sur des nombres.
 */

/** Voisinage d'une étape : fraction de l'écart entre deux étapes où le panneau reste affiché. */
export const NEAR_RATIO = 0.3;

const MIN = 0;
const MAX = 1;
const FIRST = 0;

export const clamp01 = (value: number): number => Math.min(MAX, Math.max(MIN, value));

/**
 * Fraction de défilement dans la piste : 0 quand son haut touche le haut de l'écran, 1 quand son
 * bas touche le bas de l'écran. `top` : position du haut de la piste par rapport à l'écran.
 */
export function scrollProgress(top: number, height: number, viewport: number): number {
  const range = height - viewport;
  return range > MIN ? clamp01(-top / range) : MIN;
}

/** Position de page (défilement) qui place la caméra à `progress`, la piste commençant à `trackTop`. */
export function scrollTarget(
  progress: number,
  track: { top: number; height: number },
  viewport: number,
): number {
  return track.top + clamp01(progress) * Math.max(MIN, track.height - viewport);
}

/** Indice de l'étape dont l'abscisse est la plus proche de `progress` (la première en cas d'égalité). */
export function nearestIndex(progresses: readonly number[], progress: number): number {
  let best = FIRST;
  progresses.forEach((value, index) => {
    const current = progresses[best] ?? value;
    if (Math.abs(value - progress) < Math.abs(current - progress)) best = index;
  });
  return best;
}

/** Plus petit écart entre deux étapes voisines ; 1 pour une étape seule. */
export function spacing(progresses: readonly number[]): number {
  const sorted = [...progresses].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((value, index) => value - (sorted[index] ?? value));
  return gaps.length > FIRST ? Math.min(...gaps) : MAX;
}

/** La caméra est au voisinage de l'étape : le panneau de détail s'affiche. */
export function isNear(progresses: readonly number[], index: number, progress: number): boolean {
  const at = progresses[index];
  return at !== undefined && Math.abs(progress - at) <= NEAR_RATIO * spacing(progresses);
}

/** Indice voisin, borné (précédent et suivant ne bouclent pas). */
export const stepIndex = (index: number, delta: number, count: number): number =>
  Math.min(count - MAX, Math.max(FIRST, index + delta));
