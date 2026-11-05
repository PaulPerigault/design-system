import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// « (#n) » est écrit dans `--subject` à la fusion et compte dans les 72 caractères du sujet. Le job `squash-message` relit le sujet tel quel ; le job `commitlint` ajoute
// « (#n) » au titre de la PR avant le contrôle (.github/workflows/ci.yml).
const BIN = 'node_modules/.bin/commitlint';
const lint = (message) => spawnSync(BIN, [], { input: message, encoding: 'utf8' }).status;
const subject = (length, suffix) => `${'a'.repeat(length - suffix.length)}${suffix}`;

describe('sujet de squash avec suffixe « (#n) »', () => {
  it('accepte un sujet terminé par « (#n) »', () => {
    expect(lint('fix(ci): lecture du champ échéance (#308)\n\nRefs #290\n')).toBe(0);
  });

  it('compte le suffixe : 72 caractères passent, 73 échouent', () => {
    expect(lint(`docs: ${subject(72, ' (#290)')}\n`)).toBe(0);
    expect(lint(`docs: ${subject(73, ' (#290)')}\n`)).not.toBe(0);
  });
});
