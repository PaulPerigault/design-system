import { describe, expect, it } from 'vitest';
import { fileNameOf, sbomArgs, writeSboms } from './sbom.mjs';

describe('sbom', () => {
  it('nomme le fichier sans arobase ni barre', () => {
    expect(fileNameOf('@paulperigault/tokens')).toBe('paulperigault-tokens.cdx.json');
  });

  it('demande du CycloneDX de bibliothèque sur le lockfile pour un paquet', () => {
    expect(sbomArgs('@paulperigault/css')).toEqual([
      'sbom',
      '--sbom-format',
      'cyclonedx',
      '--sbom-type',
      'library',
      '--package-lock-only',
      '-w',
      '@paulperigault/css',
    ]);
  });

  it('écrit un SBOM par paquet publiable et ignore les paquets privés', () => {
    const written = {};
    const paths = writeSboms({
      manifests: [{ name: '@paulperigault/a' }, { name: '@paulperigault/docs', private: true }],
      outDir: 'sbom',
      npm: (args) => `{"for":"${args.at(-1)}"}`,
      write: (path, text) => {
        written[path] = text;
      },
    });
    expect(paths).toEqual(['sbom/paulperigault-a.cdx.json']);
    expect(written['sbom/paulperigault-a.cdx.json']).toBe('{"for":"@paulperigault/a"}');
  });
});
