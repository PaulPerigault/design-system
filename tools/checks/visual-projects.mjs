// Projets Playwright de la régression visuelle, pour le workflow Visuel (D-141) : `pr` (sous-ensemble
// d'une PR de rendu) ou `full` (matrice complète des références). Source unique : devices.ts.
import { VISUAL_PROJECTS, VISUAL_PR_PROJECTS } from '../../apps/docs/e2e/devices.ts';

const SETS = { pr: VISUAL_PR_PROJECTS, full: VISUAL_PROJECTS };

export function projectFlags(matrix) {
  const projects = SETS[matrix];
  if (!projects) throw new Error(`matrix inconnue : « ${matrix} » (pr ou full)`);
  return projects.map((name) => `--project=${name}`).join(' ');
}

if (import.meta.main) {
  console.log(projectFlags(process.argv[2]));
}
