// Le cœur n'a aucune dépendance à Effect (ADR-0006 décision 2, ADR-0010) : manifestes et sources.
import { globSync, readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const at = (path) => `${ROOT}${path}`;

const OPTION = '@paulperigault/effect';
const core = globSync('packages/*/package.json', { cwd: ROOT })
  .map((file) => ({ file, manifest: JSON.parse(readFileSync(at(file), 'utf8')) }))
  .filter(({ manifest }) => manifest.name !== OPTION);
const IMPORT = /from\s+['"](effect|@effect\/[^'"]+|effect\/[^'"]+|@paulperigault\/effect)['"]/;

describe('isolation du cœur', () => {
  it('trouve les neuf paquets du cœur', () => {
    expect(core.length).toBeGreaterThanOrEqual(9);
  });
  it('aucun manifeste du cœur ne dépend d’Effect', () => {
    const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    const offenders = core.flatMap(({ file, manifest }) =>
      fields.flatMap((field) =>
        Object.keys(manifest[field] ?? {})
          .filter((name) => name === 'effect' || name.startsWith('@effect/') || name === OPTION)
          .map((name) => `${file} : ${field} ${name}`),
      ),
    );
    expect(offenders).toEqual([]);
  });
  it('aucune source du cœur n’importe Effect', () => {
    const offenders = core.flatMap(({ file }) =>
      globSync(file.replace('package.json', 'src/**/*.{ts,mjs,astro}'), { cwd: ROOT })
        .filter((source) => IMPORT.test(readFileSync(at(source), 'utf8')))
        .map((source) => `${source} importe Effect`),
    );
    expect(offenders).toEqual([]);
  });
  it('le paquet de l’option reste privé tant qu’il n’est pas décidé de le publier', () => {
    const manifest = JSON.parse(readFileSync(at('packages/effect/package.json'), 'utf8'));
    expect(manifest.private).toBe(true);
    expect(manifest.dependencies.effect).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
