// Ce que l'instance tire des données validées : l'entrée de la scène, les étapes dans l'ordre de
// `project()` (jalons puis objectif) et les badges à charger.
import { GOAL_ID } from './constants.ts';
import type { SceneInput } from './raw.ts';
import { themeToArray } from './raw-theme.ts';
import type { MilestonesData, Theme } from './types.ts';

export interface Plan {
  /** Identifiants des étapes : jalons dans l'ordre fourni, puis `@goal` s'il y a un objectif. */
  readonly ids: readonly string[];
}

export function sceneInput(data: MilestonesData, theme: Theme, active: string): SceneInput {
  const { milestones } = data;
  return {
    ids: milestones.map((m) => m.id),
    statuses: milestones.map((m) => m.status),
    badges: Uint8Array.from(milestones, (m) => (m.badge ? 1 : 0)),
    goal: data.goal !== undefined,
    theme: themeToArray(theme),
    active,
  };
}

export function planOf(data: MilestonesData): Plan {
  const ids = data.milestones.map((m) => m.id);
  return { ids: data.goal ? [...ids, GOAL_ID] : ids };
}
