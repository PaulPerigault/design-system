import { describe, expect, it } from 'vitest';
import { mirrorPlan, scopeProblem } from './mirror-plan.mjs';

const manifests = [
  { name: '@paulperigault/tokens', version: '0.1.0' },
  { name: '@paulperigault/css', version: '0.1.0' },
  { name: '@paulperigault/docs', version: '0.0.0', private: true },
  { name: '@paulperigault/data', version: '0.1.0' },
];

describe('scopeProblem', () => {
  it('exige le scope du propriétaire, en minuscules', () => {
    expect(scopeProblem('@paulperigault/css', 'PaulPerigault')).toBeNull();
    expect(scopeProblem('@autre/css', 'PaulPerigault')).toContain('hors du scope');
    expect(scopeProblem('@paulperigault/Css', 'PaulPerigault')).toContain('minuscules');
  });
});

describe('mirrorPlan', () => {
  it('sépare à miroiter, ignoré (privé, déjà présent) et manquant sur npmjs', () => {
    const state = {
      onNpm: (name) => name !== '@paulperigault/data',
      onGithub: (name) => name === '@paulperigault/css',
    };
    const { toMirror, skipped, missing } = mirrorPlan(manifests, state);
    expect(toMirror).toEqual(['@paulperigault/tokens@0.1.0']);
    expect(skipped).toEqual([
      { name: '@paulperigault/css', why: 'déjà sur GitHub Packages' },
      { name: '@paulperigault/docs', why: 'privé' },
    ]);
    expect(missing).toEqual(['@paulperigault/data@0.1.0']);
  });
  it('un paquet public absent de npmjs n’est jamais ignoré en silence', () => {
    const { toMirror, missing } = mirrorPlan(manifests, {
      onNpm: () => false,
      onGithub: () => false,
    });
    expect(toMirror).toEqual([]);
    expect(missing).toHaveLength(3);
  });
});
