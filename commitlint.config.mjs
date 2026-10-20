import { noToolSignature } from './tools/commitlint/no-tool-signature.mjs';

// Conventional Commits, sujet en minuscules ≤ 72 caractères, et aucune signature d'outil.
// Aucune exemption : pas d'`ignores`, et les exemptions par défaut de commitlint sont coupées.
export default {
  extends: ['@commitlint/config-conventional'],
  defaultIgnores: false,
  plugins: [{ rules: { 'no-tool-signature': noToolSignature } }],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'perf', 'revert'],
    ],
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'no-tool-signature': [2, 'always'],
  },
};
