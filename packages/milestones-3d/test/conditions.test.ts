import { describe, expect, it } from 'vitest';
import { WEAK_CORES, WEAK_MEMORY_GB } from '../src/constants.ts';
import {
  canEnhance,
  enhanceBlocker,
  isWeakDevice,
  prefersReducedMotion,
} from '../src/conditions.ts';
import type { EnhanceEnv } from '../src/conditions.ts';

const base: EnhanceEnv = {
  hasWebGL2: () => true,
  matchMedia: () => ({ matches: false }),
  navigator: { hardwareConcurrency: 8, deviceMemory: 8, connection: { saveData: false } },
  visible: true,
};
const env = (patch: Partial<EnhanceEnv>): EnhanceEnv => ({ ...base, ...patch });
const nav = (navigator: EnhanceEnv['navigator']): EnhanceEnv => env({ navigator });

describe('canEnhance : table de cas', () => {
  const cases: [string, EnhanceEnv, string | null][] = [
    ['tout est réuni', base, null],
    ['WebGL2 absent', env({ hasWebGL2: () => false }), 'no-webgl2'],
    [
      'mouvement réduit : la 3D reste admise (ADR-0013)',
      env({ matchMedia: (q) => ({ matches: q.includes('reduced-motion') }) }),
      null,
    ],
    ['saveData actif', nav({ ...base.navigator, connection: { saveData: true } }), 'save-data'],
    ['deux cœurs', nav({ hardwareConcurrency: WEAK_CORES }), 'weak-device'],
    ['un cœur', nav({ hardwareConcurrency: 1 }), 'weak-device'],
    ['trois cœurs', nav({ hardwareConcurrency: WEAK_CORES + 1 }), null],
    ['2 Go de mémoire', nav({ deviceMemory: WEAK_MEMORY_GB }), 'weak-device'],
    ['0,5 Go de mémoire', nav({ deviceMemory: 0.5 }), 'weak-device'],
    ['4 Go de mémoire', nav({ deviceMemory: 4 }), null],
    ['section invisible', env({ visible: false }), 'hidden'],
    ['Firefox et Safari : tout absent', nav({}), null],
    [
      'valeurs absentes mais nommées',
      nav({ hardwareConcurrency: undefined, deviceMemory: undefined, connection: undefined }),
      null,
    ],
    ['connection sans saveData', nav({ connection: {} }), null],
    ['saveData à false', nav({ connection: { saveData: false } }), null],
    ['cœurs à 0 (pas une mesure)', nav({ hardwareConcurrency: 0 }), null],
    [
      'cœurs non finis',
      nav({ hardwareConcurrency: Number.NaN, deviceMemory: Number.POSITIVE_INFINITY }),
      null,
    ],
    ['mémoire négative (pas une mesure)', nav({ deviceMemory: -1 }), null],
  ];
  for (const [name, input, reason] of cases) {
    it(`${name} : ${reason ?? 'admis'}`, () => {
      expect(enhanceBlocker(input)).toBe(reason);
      expect(canEnhance(input)).toBe(reason === null);
    });
  }
});

describe('prefersReducedMotion', () => {
  it('lit prefers-reduced-motion, sans rien bloquer', () => {
    const queries: string[] = [];
    const asking = (matches: boolean) => ({
      matchMedia: (query: string) => (queries.push(query), { matches }),
    });
    expect(prefersReducedMotion(asking(true))).toBe(true);
    expect(prefersReducedMotion(asking(false))).toBe(false);
    expect(queries).toEqual([
      '(prefers-reduced-motion: reduce)',
      '(prefers-reduced-motion: reduce)',
    ]);
  });

  it('aucune raison de repli ne s’appelle reduced-motion', () => {
    const reduced = env({ matchMedia: () => ({ matches: true }) });
    expect(enhanceBlocker(reduced)).toBeNull();
    expect(canEnhance(reduced)).toBe(true);
  });
});

describe('une valeur absente ne compte pas', () => {
  it('ni comme appareil faible', () => {
    expect(isWeakDevice({})).toBe(false);
    expect(isWeakDevice({ hardwareConcurrency: undefined })).toBe(false);
    expect(isWeakDevice({ deviceMemory: undefined })).toBe(false);
  });

  it('seule une mesure faible suffit, l’autre pouvant manquer', () => {
    expect(isWeakDevice({ hardwareConcurrency: 2 })).toBe(true);
    expect(isWeakDevice({ deviceMemory: 1 })).toBe(true);
    expect(isWeakDevice({ hardwareConcurrency: 16, deviceMemory: 1 })).toBe(true);
    expect(isWeakDevice({ hardwareConcurrency: 2, deviceMemory: 16 })).toBe(true);
    expect(isWeakDevice({ hardwareConcurrency: 16, deviceMemory: 16 })).toBe(false);
  });
});

describe('ordre des contrôles', () => {
  it('n’essaie WebGL2 que si tout le reste passe (un contexte coûte)', () => {
    let calls = 0;
    const counted = (patch: Partial<EnhanceEnv>) =>
      env({ ...patch, hasWebGL2: () => ((calls += 1), true) });
    enhanceBlocker(counted({ visible: false }));
    enhanceBlocker(counted({ navigator: { hardwareConcurrency: 1 } }));
    expect(calls).toBe(0);
    enhanceBlocker(counted({}));
    expect(calls).toBe(1);
  });

  it('signale la première condition qui échoue', () => {
    const all = env({
      visible: false,
      hasWebGL2: () => false,
      navigator: { hardwareConcurrency: 1 },
    });
    expect(enhanceBlocker(all)).toBe('weak-device');
  });
});
