// Le rendu fonctionne sans ce paquet, et les builds du dépôt n'appellent ni cargo ni wasm-bindgen
// (le build Cloudflare n'installe ni rustup ni cargo : il consomme le paquet publié).
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const read = (path: string): { scripts?: Record<string, string>; [key: string]: unknown } =>
  JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'));

const CONSUMERS = ['packages/dataviz', 'packages/astro', 'packages/tokens', 'apps/docs'];
const RUST = /cargo|wasm-pack|wasm-bindgen|rustup/;

it('aucun paquet de rendu ne dépend de @paulperigault/data', () => {
  for (const dir of CONSUMERS) {
    const manifest = read(`${dir}/package.json`);
    const dependencies = JSON.stringify([
      manifest['dependencies'],
      manifest['devDependencies'],
      manifest['peerDependencies'],
      manifest['optionalDependencies'],
    ]);
    expect(dependencies, dir).not.toContain('@paulperigault/data"');
    expect(dependencies, dir).not.toContain('@paulperigault/color"');
  }
});

it('les scripts de build du site et de la racine n’appellent pas Rust', () => {
  const root = read('package.json').scripts ?? {};
  const docs = read('apps/docs/package.json').scripts ?? {};
  for (const [name, script] of [
    ['build racine', root['build']],
    ['build docs', docs['build']],
    ['prebuild docs', docs['prebuild']],
  ] as const) {
    expect(script ?? '', name).not.toMatch(RUST);
  }
});
