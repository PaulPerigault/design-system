/** Immobilité des étiquettes : décide quand la boucle d'images peut s'arrêter. */
import type { Mark } from './milestones-3d-types';

/** Tolérance sous laquelle une étiquette est considérée immobile (fraction du cadre). */
export const SETTLED = 0.0005;

/** Les positions ont-elles bougé depuis l'image précédente ? */
export function moved(before: readonly Mark[], after: readonly Mark[]): boolean {
  if (before.length !== after.length) return true;
  return after.some((mark, index) => {
    const old = before[index];
    return (
      !old ||
      old.visible !== mark.visible ||
      Math.abs(old.x - mark.x) > SETTLED ||
      Math.abs(old.y - mark.y) > SETTLED ||
      Math.abs(old.scale - mark.scale) > SETTLED
    );
  });
}
