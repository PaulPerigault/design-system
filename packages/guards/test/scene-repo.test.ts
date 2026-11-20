import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaults as layerDefaults, run as runLayers } from '../src/application/check-layers.ts';
import { isRecord } from '../src/domain/options.ts';
import { fakeIo } from './fake-io.ts';

describe('dépôt : couche et dépendances de milestones-3d', () => {
  const config: unknown = JSON.parse(
    readFileSync(new URL('../../../pp-guards.config.json', import.meta.url), 'utf8'),
  );
  const layers = isRecord(config) && isRecord(config.layers) ? config.layers : {};
  const layerOptions = { ...layerDefaults, ...layers, roots: ['packages'] };
  const refuse = (file: string, text: string) => {
    const { io, err } = fakeIo({ [file]: text });
    return { code: runLayers(layerOptions, io), err };
  };

  it('refuse qu’il importe un autre paquet du système, quel que soit le sens', () => {
    for (const target of ['tokens', 'css', 'color', 'dataviz', 'data', 'astro']) {
      const { code, err } = refuse(
        'packages/milestones-3d/src/a.ts',
        `import '@paulperigault/${target}';`,
      );
      expect([target, code]).toEqual([target, 1]);
      expect(err[0]).toContain('sens refusé');
    }
  });

  it('laisse astro l’importer, et le paquet s’importer lui-même', () => {
    expect(refuse('packages/astro/src/a.ts', "import '@paulperigault/milestones-3d';").code).toBe(
      0,
    );
    expect(refuse('packages/milestones-3d/src/a.ts', "import './b.ts';").code).toBe(0);
  });

  it('n’a aucune dépendance d’exécution dans package.json', () => {
    const parsed: unknown = JSON.parse(
      readFileSync(new URL('../../milestones-3d/package.json', import.meta.url), 'utf8'),
    );
    const manifest = isRecord(parsed) ? parsed : {};
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
  });

  it('déclare la section scene avec les sources du Rust et du paquet', () => {
    const scene = isRecord(config) && isRecord(config.scene) ? config.scene : {};
    expect(scene.roots).toEqual([
      'crates/pp-milestones/src',
      'crates/pp-milestones-wasm/src',
      'packages/milestones-3d/src',
    ]);
    expect(scene.themeFiles).toEqual(['packages/milestones-3d/src/constants.ts']);
  });
});
