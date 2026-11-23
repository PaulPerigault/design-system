/** Bloc de données JSON de Milestones3D : seulement ce que `@paulperigault/milestones-3d` valide. */
import type { MilestoneGoal, MilestoneItem } from './milestones-3d-model';

/** Copie sans `description` (texte du panneau, HTML seulement) : la scène ne reçoit que le contrat. */
const withoutDescription = <T extends object>(value: T): Omit<T, 'description'> =>
  Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'description')) as Omit<
    T,
    'description'
  >;

/** Sérialise les données pour un bloc `application/json` : `<` échappé, `</script>` impossible. */
export const dataBlock = (milestones: MilestoneItem[], goal?: MilestoneGoal): string =>
  JSON.stringify({
    milestones: milestones.map((item) => withoutDescription(item)),
    ...(goal ? { goal: withoutDescription(goal) } : {}),
  }).replace(/</g, '\\u003c');
