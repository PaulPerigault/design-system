import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const config = read('release-please-config.json');
const manifest = read('.release-please-manifest.json');
// `packages/effect` est privé (D-140) : hors release-please tant qu'il n'est pas publiable.
const workspaces = globSync('packages/*/package.json')
  .map((file) => ({
    dir: file.split('\\').join('/').replace('/package.json', ''),
    pkg: read(file),
  }))
  .filter(({ pkg }) => !pkg.private);
const isZeroX = (version) => /^0\.\d+\.\d+$/.test(version);

describe('release-please : neuf paquets en 0.x', () => {
  it('config, manifeste et dossiers listent les mêmes neuf paquets', () => {
    const dirs = workspaces.map(({ dir }) => dir).sort();
    expect(dirs).toHaveLength(9);
    expect(Object.keys(config.packages).sort()).toEqual(dirs);
    expect(Object.keys(manifest).sort()).toEqual(dirs);
  });

  it('chaque paquet est public, en 0.x, et son nom suit la config', () => {
    for (const { dir, pkg } of workspaces) {
      expect(isZeroX(pkg.version), dir).toBe(true);
      expect(isZeroX(manifest[dir]), dir).toBe(true);
      expect(config.packages[dir]['package-name'], dir).toBe(pkg.name);
    }
  });

  it('sans tag existant, la première version est une 0.x (pas la 1.0.0 par défaut)', () => {
    expect(isZeroX(config['initial-version'])).toBe(true);
    expect(config['bump-minor-pre-major']).toBe(true);
  });
});
