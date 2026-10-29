import { describe, expect, it } from 'vitest';
import { parseCli } from '../../scripts/lib/cli.ts';

describe('parseCli', () => {
  it('sans argument : génération par défaut', () => {
    expect(parseCli([])).toEqual({
      ok: true,
      value: { check: false, input: {}, outDir: undefined },
    });
    expect(parseCli(['--check'])).toMatchObject({ ok: true, value: { check: true } });
  });

  it('teinte, pile et dossier de sortie', () => {
    const argv = ['--accent-hue', '145', '--font-stack', 'Inter, sans-serif', '--out-dir', 'out'];
    expect(parseCli(argv)).toEqual({
      ok: true,
      value: {
        check: false,
        input: { accentHue: 145, fontStack: 'Inter, sans-serif' },
        outDir: 'out',
      },
    });
  });

  it('une entrée personnalisée sans --out-dir ou avec --check est refusée', () => {
    expect(parseCli(['--accent-hue', '145'])).toMatchObject({
      ok: false,
      error: { code: 'build.bad-usage' },
    });
    expect(parseCli(['--accent-hue', '145', '--out-dir', 'o', '--check'])).toMatchObject({
      ok: false,
      error: { code: 'build.bad-usage' },
    });
  });

  it('relaie les erreurs de validation', () => {
    expect(parseCli(['--accent-hue', '400', '--out-dir', 'o'])).toMatchObject({
      ok: false,
      error: { code: 'build.hue-out-of-range' },
    });
    expect(parseCli(['--font-stack', 'a;b', '--out-dir', 'o'])).toMatchObject({
      ok: false,
      error: { code: 'build.stack-unsafe' },
    });
  });
});
