import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toolSignatures } from '../commitlint/no-tool-signature.mjs';

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

// Corps d'une PR de release-please : en-tête, notes entre deux `---`, pied de page (d'après le code source de
// `PullRequestBody`). Un pied de page vide retombe sur celui par défaut.
const DEFAULT_HEADER = ':robot: I have created a release *beep* *boop*';
const DEFAULT_FOOTER =
  'This PR was generated with [Release Please](https://github.com/googleapis/release-please).';
const body = (footer) => `${DEFAULT_HEADER}
---

## 0.1.0

* feat

---
${footer}`;

describe('release-please : pied de page accepté par commitlint (no-tool-signature)', () => {
  it('le pied de page par défaut est refusé, d’où la configuration', () => {
    expect(toolSignatures(body(DEFAULT_FOOTER))).toEqual(['mention « Generated with »']);
  });

  it('le pied de page configuré est non vide et laisse passer le corps de la PR', () => {
    const footer = config['pull-request-footer'];
    expect(typeof footer).toBe('string');
    expect(footer.trim().length).toBeGreaterThan(0);
    expect(footer).not.toBe(DEFAULT_FOOTER);
    expect(toolSignatures(body(footer))).toEqual([]);
  });

  it('« Generated with Claude Code » et Co-Authored-By restent refusés', () => {
    const footer = config['pull-request-footer'];
    expect(
      toolSignatures(`${body(footer)}

Generated with Claude Code`),
    ).toEqual(['mention « Generated with »']);
    const trailer = `${body(footer)}

Co-Authored-By: Claude <noreply@anthropic.com>`;
    expect(toolSignatures(trailer)).toEqual(['ligne « Co-authored-by »']);
  });
});
