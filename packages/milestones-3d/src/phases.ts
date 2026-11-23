// Marques de durée des phases d'initialisation (`performance.measure`, préfixe `pp3d:`) : bon marché,
// lues par l'audit web (tools/audit) pour dire quelle phase forme une tâche longue. Sans effet hors
// navigateur ou si l'API manque ; ne lève jamais.
export const PHASE_PREFIX = 'pp3d:';

/** Début d'une phase (horloge de la page). */
export const phaseStart = (): number =>
  typeof performance === 'object' && typeof performance.now === 'function' ? performance.now() : 0;

/** Clôt la phase `name` commencée à `start`. */
export function phaseEnd(name: string, start: number): void {
  try {
    if (typeof performance === 'object' && typeof performance.measure === 'function') {
      performance.measure(`${PHASE_PREFIX}${name}`, { start, end: performance.now() });
    }
  } catch {
    // Mesure indisponible : l'initialisation ne dépend jamais d'elle.
  }
}

/** Exécute `run` en mesurant la phase `name` (synchrone). */
export function timed<T>(name: string, run: () => T): T {
  const start = phaseStart();
  try {
    return run();
  } finally {
    phaseEnd(name, start);
  }
}
