import { describe, expect, it } from 'vitest';
import { LIFECYCLE_SCRIPTS, ManifestError, mirrorManifest } from './mirror-manifest.mjs';
import { GITHUB_REGISTRY } from './mirror-plan.mjs';

const published = () => ({
  name: '@paulperigault/tokens',
  version: '0.1.0',
  license: 'MIT',
  repository: { type: 'git', url: 'git+https://github.com/PaulPerigault/design-system.git' },
  files: ['dist', 'src'],
  bin: { pp: './bin/pp.js' },
  exports: { '.': { default: './dist/index.js' } },
  dependencies: { '@paulperigault/css': '0.1.0' },
  publishConfig: { registry: 'https://registry.npmjs.org/', access: 'public', provenance: true },
  scripts: {
    prepublishOnly: 'node ../../tools/checks/check-publish-env.mjs',
    prepack: 'npm run build',
    build: 'tsc',
    check: 'node scripts/build.ts --check',
  },
});

describe('mirrorManifest : scripts de cycle de vie', () => {
  it('retire prepublishOnly et prepack, garde les autres scripts', () => {
    expect(mirrorManifest(published()).scripts).toEqual({
      build: 'tsc',
      check: 'node scripts/build.ts --check',
    });
  });
  it.each(LIFECYCLE_SCRIPTS)('retire %s', (id) => {
    const manifest = { name: 'a', scripts: { [id]: 'node ../../x.mjs', test: 'vitest' } };
    expect(mirrorManifest(manifest).scripts).toEqual({ test: 'vitest' });
  });
  it('liste exactement les sept scripts que npm lance à la publication', () => {
    expect([...LIFECYCLE_SCRIPTS].sort()).toEqual(
      [
        'postpack',
        'postpublish',
        'prepack',
        'prepare',
        'prepublish',
        'prepublishOnly',
        'publish',
      ].sort(),
    );
  });
  it('ne crée pas de clé scripts absente', () => {
    expect('scripts' in mirrorManifest({ name: 'a' })).toBe(false);
  });
});

describe('mirrorManifest : le reste du manifeste', () => {
  it('vise le registre de GitHub, sans provenance', () => {
    expect(mirrorManifest(published()).publishConfig).toEqual({
      registry: GITHUB_REGISTRY,
      access: 'public',
    });
  });
  it('fonctionne sans publishConfig', () => {
    expect(mirrorManifest({ name: 'a' }).publishConfig.registry).toBe(GITHUB_REGISTRY);
  });
  it.each(['name', 'version', 'license', 'repository', 'files', 'bin', 'exports', 'dependencies'])(
    'conserve %s à l’identique',
    (key) => {
      expect(mirrorManifest(published())[key]).toEqual(published()[key]);
    },
  );
  it('ne modifie pas le manifeste d’origine', () => {
    const manifest = published();
    mirrorManifest(manifest);
    expect(manifest).toEqual(published());
  });
});

describe('mirrorManifest : entrée invalide', () => {
  it.each([null, [], 'texte', 3])('refuse un manifeste %j', (value) => {
    expect(() => mirrorManifest(value)).toThrow(ManifestError);
  });
  it('refuse des scripts qui ne sont pas un objet', () => {
    expect(() => mirrorManifest({ scripts: 'build' })).toThrow(ManifestError);
    expect(() => mirrorManifest({ scripts: null })).toThrow(/scripts/);
  });
  it('refuse un publishConfig qui n’est pas un objet', () => {
    expect(() => mirrorManifest({ publishConfig: 'x' })).toThrow(/publishConfig/);
  });
});
