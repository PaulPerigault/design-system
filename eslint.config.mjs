import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';
import { designRules, testRelaxations } from './eslint.design-rules.mjs';

/** Paquets déjà migrés en TypeScript strict : on ajoute ici un paquet par PR de migration. */
const TS_STRICT_FILES = [
  'packages/tokens/**/*.ts',
  'packages/guards/**/*.ts',
  'packages/dataviz/**/*.ts',
  'packages/color/**/*.ts',
  'packages/data/**/*.ts',
  'packages/create/**/*.ts',
  'packages/mcp/**/*.ts',
  'tools/agents/**/*.ts',
];

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.agents/**',
      '.claude/**',
      'packages/color/wasm/**',
      'packages/data/wasm/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: 'error',
      'no-console': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      ...designRules,
    },
  },
  {
    // TypeScript strict (ADR-0005) : aucune assertion `as` sauf dérogation locale justifiée
    // (`// eslint-disable-next-line … -- justifié : raison`). `as const` reste permis.
    files: TS_STRICT_FILES,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    // Les tests décrivent des cas : blocs `describe` longs et valeurs littérales assumés.
    files: ['**/*.test.{ts,mjs}', '**/test/**/*.ts', '**/e2e/**/*.ts'],
    rules: testRelaxations,
  },
  {
    files: ['**/*.config.{ts,mjs}', 'eslint.design-rules.mjs'],
    rules: { '@typescript-eslint/no-magic-numbers': 'off', 'no-undef': 'off' },
  },
  {
    // Outils Node (dispatcher, contrôles, hooks) : sorties console et globaux Node assumés.
    files: ['tools/**/*.{mjs,ts}', 'packages/*/scripts/**/*.{mjs,ts}', 'packages/*/bin/**/*.mjs'],
    rules: { 'no-console': 'off', 'no-undef': 'off', '@typescript-eslint/no-magic-numbers': 'off' },
  },
  eslintConfigPrettier,
);
