import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = readFileSync('LICENSE', 'utf8');
const manifests = globSync('packages/*/package.json')
  .map((file) => ({ file, manifest: JSON.parse(readFileSync(file, 'utf8')) }))
  .filter(({ manifest }) => !manifest.private);

describe('LICENSE des paquets publiés', () => {
  it('trouve les neuf paquets', () => {
    expect(manifests).toHaveLength(9);
  });
  it.each(manifests.map(({ file }) => [file.replace('package.json', 'LICENSE')]))(
    '%s est identique à la licence du dépôt',
    (license) => {
      expect(readFileSync(license, 'utf8')).toBe(root);
    },
  );
  it('chaque manifeste déclare MIT', () => {
    expect(manifests.every(({ manifest }) => manifest.license === 'MIT')).toBe(true);
  });
});
