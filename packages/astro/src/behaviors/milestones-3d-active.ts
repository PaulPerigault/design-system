/** Étape active de Milestones3D : repère d'étapes, étiquettes, scène et panneau d'un seul tenant. */
import type { Labels } from './milestones-3d-labels';
import type { Steps } from './milestones-3d-steps';
import type { Scene } from './milestones-3d-types';
import type { Parts } from './milestones-3d-view';
import { ids, markActive, showDetail } from './milestones-3d-view';

export interface Active {
  /** Étape active, `-1` avant la première. */
  index(): number;
  /** Rend `next` actif ; `close` : la caméra est au voisinage, le panneau affiche son détail. */
  show(next: number, close: boolean): void;
}

export interface ActiveParts {
  parts: Parts;
  scene: Scene;
  steps: Steps;
  labels: Labels;
}

const NONE = -1;

export function createActive({ parts, scene, steps, labels }: ActiveParts): Active {
  const order = ids(parts);
  let index = NONE;
  let near: boolean | null = null;
  return {
    index: () => index,
    show(next, close) {
      const id = order[next] ?? '';
      const changed = next !== index;
      if (changed) {
        index = next;
        markActive(parts, next);
        scene.setActive(id);
        steps.update(next);
        labels.setActive(id);
      }
      if (changed || close !== near) showDetail(parts, close ? id : null);
      near = close;
    },
  };
}
