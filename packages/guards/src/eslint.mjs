/**
 * Limites de conception : petites fonctions, faible complexité, pas de nombres magiques.
 * Exporte les règles ESLint de conception et un générateur de config plate.
 *
 * La règle `@typescript-eslint/no-magic-numbers` suppose que le greffon
 * `typescript-eslint` est chargé par le consommateur. Ce paquet n'a aucune
 * dépendance d'exécution.
 */

// Seuils de conception (constantes nommées, soumises à no-magic-numbers).
const MAX_LINES_PER_FUNCTION = 40;
const COMPLEXITY_LIMIT = 8;
const MAX_DEPTH_LIMIT = 3;
const MAX_PARAMS_LIMIT = 4;
const MAX_NESTED_CALLBACKS_LIMIT = 3;

const DEFAULT_TEST_FILES = ['**/*.test.{ts,mjs,js}', '**/test/**/*.ts', '**/e2e/**/*.ts'];

export const designRules = {
  'max-lines-per-function': [
    'error',
    { max: MAX_LINES_PER_FUNCTION, skipBlankLines: true, skipComments: true, IIFEs: true },
  ],
  complexity: ['error', COMPLEXITY_LIMIT],
  'max-depth': ['error', MAX_DEPTH_LIMIT],
  'max-params': ['error', MAX_PARAMS_LIMIT],
  'max-nested-callbacks': ['error', MAX_NESTED_CALLBACKS_LIMIT],
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
};

/** Les tests décrivent des cas : blocs `describe` longs et valeurs littérales assumés. */
export const testRelaxations = {
  'max-lines-per-function': 'off',
  'max-nested-callbacks': 'off',
  '@typescript-eslint/no-magic-numbers': 'off',
};

/**
 * Génère une config plate ESLint avec les règles de conception.
 * @param {{ testFiles?: string[] }} [options] options
 * @returns {Array<{ rules: object, files?: string[] }>}
 */
export function designConfig({ testFiles = DEFAULT_TEST_FILES } = {}) {
  return [{ rules: designRules }, { files: testFiles, rules: testRelaxations }];
}
