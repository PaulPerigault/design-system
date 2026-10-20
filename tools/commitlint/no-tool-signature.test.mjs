import { describe, expect, it } from 'vitest';
import { noToolSignature, toolSignatures } from './no-tool-signature.mjs';

describe('toolSignatures', () => {
  it('accepte un message propre', () => {
    expect(toolSignatures('feat(tokens): ajoute la rampe\n\nCorps factuel.\n\nCloses #3')).toEqual(
      [],
    );
  });

  it.each([
    'feat: x\n\nCo-Authored-By: Someone <a@b.c>',
    'feat: x\n\nco-authored-by: Someone <a@b.c>',
    'fix: y (#12)\n\n  Co-authored-by: X <x@y.z>',
  ])('refuse une ligne Co-authored-by : %s', (message) => {
    expect(toolSignatures(message)).toContain('ligne « Co-authored-by »');
  });

  it('refuse « Generated with », même dans un sujet de squash', () => {
    expect(toolSignatures('chore: z (#4)\n\nGenerated with an assistant')).toEqual([
      'mention « Generated with »',
    ]);
  });
});

describe('noToolSignature (format commitlint)', () => {
  it('rend [true, …] pour un message propre et [false, raison] sinon', () => {
    expect(noToolSignature({ raw: 'docs: a' })[0]).toBe(true);
    const [valid, reason] = noToolSignature({ raw: 'docs: a\n\nCo-authored-by: b <c@d.e>' });
    expect(valid).toBe(false);
    expect(reason).toMatch(/Co-authored-by/);
  });
});
