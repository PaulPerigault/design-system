import { describe, expect, it } from 'vitest';
import * as reg0 from '../src/application/registry-io.ts';
import * as reg1 from '../src/domain/registry.ts';
const reg = { ...reg0, ...reg1 };
import { fakeIo, fakePackage } from './fake-io.mjs';

const stack = { name: 'stack', title: 'Stack', files: [{ path: 'packages/astro/src/S.astro' }] };
const button = { name: 'button', title: 'Bouton', files: [{ path: 'packages/astro/src/B.astro' }] };
const ROOT = '/projet/node_modules/@paulperigault/astro';
const ITEMS = `${ROOT}/registry/items`;

describe('registry', () => {
  it('trie les éléments et lit la version', () => {
    const { io } = fakeIo(fakePackage({}, [stack, button]));
    const root = reg.packageRoot(io);
    expect(root).toBe(ROOT);
    expect(reg.packageRoot(io, 'node_modules/@paulperigault/astro')).toBe(ROOT);
    expect(reg.packageRoot(io, ROOT)).toBe(ROOT);
    expect(reg.loadItems(io, root).map((i) => i.name)).toEqual(['button', 'stack']);
    expect(reg.packageVersion(io, root)).toBe('1.2.3');
  });

  it('explique comment installer un paquet absent', () => {
    expect(() => reg.packageRoot(fakeIo({}).io)).toThrow('npm i @paulperigault/astro');
  });

  it('signale un fragment invalide avec son chemin', () => {
    const files = fakePackage({}, [stack]);
    const { io } = fakeIo(files);
    for (const bad of ['{nope', '{"name":"x"}', '{"name":"x","files":[{"path":1}]}']) {
      files[`${ITEMS}/bad.json`] = bad;
      expect(() => reg.loadItems(io, ROOT)).toThrow(`${ITEMS}/bad.json`);
    }
  });

  it('trouve par nom ou titre sans tenir compte de la casse', () => {
    const items = [button, stack];
    expect(reg.findItem(items, 'Button')).toBe(button);
    expect(reg.findItem(items, 'bouton')).toBe(button);
    expect(reg.findItem(items, 'STACK')).toBe(stack);
    expect(() => reg.findItem(items, 'card')).toThrow('button, stack');
  });

  it('retire le préfixe du dépôt et refuse les chemins hors paquet', () => {
    expect(reg.itemFiles(stack)).toEqual(['src/S.astro']);
    const paths = ['../x.astro', '/etc/passwd', 'packages/astro/../../x', '', 'packages/astro/'];
    for (const path of paths) {
      expect(() => reg.itemFiles({ name: 'evil', files: [{ path }] })).toThrow('hors du paquet');
    }
  });

  it('refuse un package.json illisible ou sans version', () => {
    const files = fakePackage({}, [stack]);
    const { io } = fakeIo(files);
    files[`${ROOT}/package.json`] = '{nope';
    expect(() => reg.packageVersion(io, ROOT)).toThrow(`${ROOT}/package.json`);
    files[`${ROOT}/package.json`] = '{"version":1}';
    expect(() => reg.packageVersion(io, ROOT)).toThrow('version');
  });
});
