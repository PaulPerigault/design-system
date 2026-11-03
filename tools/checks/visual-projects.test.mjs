import { describe, expect, it } from 'vitest';
import { MATRIX, VISUAL_PROJECTS, VISUAL_PR_PROJECTS } from '../../apps/docs/e2e/devices.ts';
import { projectFlags } from './visual-projects.mjs';

const names = MATRIX.map((device) => `matrice-${device.name}`);

describe('projets de la régression visuelle', () => {
  it('le sous-ensemble des PR est inclus dans les références, elles-mêmes dans la matrice', () => {
    expect(VISUAL_PR_PROJECTS.every((name) => VISUAL_PROJECTS.includes(name))).toBe(true);
    expect(VISUAL_PROJECTS.every((name) => names.includes(name))).toBe(true);
  });

  it('le sous-ensemble est strict : une PR capture moins que le run complet', () => {
    expect(VISUAL_PR_PROJECTS.length).toBeLessThan(VISUAL_PROJECTS.length);
    expect(VISUAL_PR_PROJECTS.length).toBeGreaterThan(0);
  });

  it('pr et full donnent un drapeau --project par projet', () => {
    expect(projectFlags('pr').split(' ')).toEqual(
      VISUAL_PR_PROJECTS.map((name) => `--project=${name}`),
    );
    expect(projectFlags('full').split(' ')).toHaveLength(VISUAL_PROJECTS.length);
  });

  it('refuse une matrice inconnue au lieu de tout capturer', () => {
    expect(() => projectFlags('')).toThrow(/matrix inconnue/);
    expect(() => projectFlags('tout')).toThrow(/pr ou full/);
  });
});
