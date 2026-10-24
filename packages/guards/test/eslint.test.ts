import { describe, expect, it } from 'vitest';
import { designRules, testRelaxations, designConfig } from '../src/eslint.ts';
import {
  designRules as rootDesignRules,
  testRelaxations as rootTestRelaxations,
} from '../../../eslint.design-rules.mjs';

describe('designRules', () => {
  it('contient les limites de conception', () => {
    expect(designRules).toEqual({
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
    });
  });
});

describe('testRelaxations', () => {
  it('désactive les règles incompatibles avec les tests', () => {
    expect(testRelaxations).toEqual({
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
    });
  });
});

describe('designConfig', () => {
  it('retourne un tableau de config plate par défaut', () => {
    const config = designConfig();
    expect(config).toHaveLength(2);
    expect(config[0]).toEqual({ rules: designRules });
    expect(config[1].files).toEqual(['**/*.test.{ts,mjs,js}', '**/test/**/*.ts', '**/e2e/**/*.ts']);
    expect(config[1].rules).toEqual(testRelaxations);
  });

  it('accepte des testFiles personnalisés', () => {
    const custom = ['**/*.spec.ts', '**/__tests__/**/*.ts'];
    const config = designConfig({ testFiles: custom });
    expect(config[1].files).toEqual(custom);
    expect(config[1].rules).toEqual(testRelaxations);
  });

  it("respecte l'identité des exports racine", () => {
    expect(designRules).toBe(rootDesignRules);
    expect(testRelaxations).toBe(rootTestRelaxations);
  });
});
