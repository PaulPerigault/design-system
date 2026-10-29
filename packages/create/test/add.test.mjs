import { describe, expect, it } from 'vitest';
import { run } from '../src/commands/add.ts';
import { fakeIo, fakePackage } from './fake-io.mjs';

const ROOT = '/projet/node_modules/@paulperigault/astro';
const PKG = '/projet/package.json';
const stack = { name: 'stack', files: [{ path: 'packages/astro/src/layout/Stack.astro' }] };
const card = {
  name: 'card',
  files: [{ path: 'packages/astro/src/Card.astro' }, { path: 'packages/astro/src/card.css' }],
  registryDependencies: ['stack', 'cluster'],
};
const exportsMap = { './Stack.astro': './src/Stack.astro', './Card.astro': './src/Card.astro' };

function setup(manifest = '{\n  "name": "site",\n  "private": true\n}\n') {
  const files = fakePackage({}, [stack, card], { version: '1.2.3' });
  files[`${ROOT}/package.json`] = JSON.stringify({ version: '1.2.3', exports: exportsMap });
  if (manifest !== null) files[PKG] = manifest;
  return fakeIo(files);
}

const args = (name, extra = {}) => ({ positionals: [name], ...extra });

describe('add', () => {
  it('ajoute la dépendance exacte en conservant clés et indentation', () => {
    const { io, files, err } = setup(
      '{\n    "name": "site",\n    "dependencies": {\n' +
        '      "astro": "5.0.0",\n      "zod": "3.0.0"\n    }\n}\n',
    );
    expect(run(args('stack'), { io })).toBe(0);
    expect(files[PKG]).toBe(
      '{\n    "name": "site",\n    "dependencies": {\n        "@paulperigault/astro": "1.2.3",\n' +
        '        "astro": "5.0.0",\n        "zod": "3.0.0"\n    }\n}\n',
    );
    expect(err).toEqual([]);
  });

  it('crée dependencies si absent, indentation par tabulation', () => {
    const { io, files } = setup('{\n\t"name": "site"\n}');
    expect(run(args('stack'), { io })).toBe(0);
    expect(files[PKG]).toBe(
      '{\n\t"name": "site",\n\t"dependencies": {\n\t\t"@paulperigault/astro": "1.2.3"\n\t}\n}',
    );
  });

  it('ne touche pas package.json si le paquet est déjà en dépendance', () => {
    for (const field of ['dependencies', 'devDependencies']) {
      const manifest = JSON.stringify({
        name: 'site',
        [field]: { '@paulperigault/astro': '^1.0.0' },
      });
      const { io, files, out } = setup(manifest);
      expect(run(args('stack'), { io })).toBe(0);
      expect(files[PKG]).toBe(manifest);
      expect(out.some((line) => line.startsWith('écrit'))).toBe(false);
    }
  });

  it('affiche un import par fichier .astro et les éléments requis', () => {
    const { io, out, err } = setup();
    expect(run(args('STACK'), { io })).toBe(0);
    expect(out).toContain("import Stack from '@paulperigault/astro/Stack.astro';");
    expect(run(args('card'), { io })).toBe(0);
    expect(err).toEqual([]);
    expect(out.filter((line) => line.startsWith('import ')).slice(1)).toEqual([
      "import Card from '@paulperigault/astro/Card.astro';",
    ]);
    expect(out.at(-1)).toBe('éléments requis : stack, cluster');
  });

  it('avertit si l’export manque, sans changer le code', () => {
    const { io, files, err } = setup();
    files[`${ROOT}/package.json`] = JSON.stringify({ version: '1.2.3', exports: { './x': './x' } });
    expect(run(args('stack'), { io })).toBe(0);
    expect(err).toEqual([expect.stringContaining("n'exporte pas « ./Stack.astro »")]);
    files[`${ROOT}/package.json`] = JSON.stringify({ version: '1.2.3' });
    expect(run(args('stack'), { io })).toBe(0);
    expect(err).toHaveLength(2);
  });

  it('élément inconnu, paquet absent ou usage faux → code 2', () => {
    const one = setup();
    expect(run(args('carte'), { io: one.io })).toBe(2);
    expect(one.err[0]).toContain('« carte » introuvable');
    const two = fakeIo({ [PKG]: '{}' });
    expect(run(args('stack'), { io: two.io })).toBe(2);
    expect(two.err[0]).toContain('npm i @paulperigault/astro');
    const three = setup();
    expect(run({ positionals: [] }, { io: three.io })).toBe(2);
    expect(run({ positionals: ['a', 'b'] }, { io: three.io })).toBe(2);
    expect(three.err[0]).toBe('usage : add <élément>');
  });

  it('sans package.json ou JSON invalide → code 1', () => {
    const { io, err } = setup(null);
    expect(run(args('stack'), { io })).toBe(1);
    expect(err[0]).toContain('package.json introuvable');
    const bad = setup('{nope');
    expect(run(args('stack'), { io: bad.io })).toBe(1);
  });

  it('--dry-run liste sans écrire', () => {
    const manifest = '{\n  "name": "site"\n}\n';
    const { io, files, out } = setup(manifest);
    expect(run(args('stack', { dryRun: true }), { io })).toBe(0);
    expect(files[PKG]).toBe(manifest);
    expect(out[0]).toBe('écraserait package.json');
  });

  it('--from pointe vers un autre paquet installé', () => {
    const files = fakePackage({}, [stack], { cwd: '/ailleurs', version: '9.9.9' });
    files[PKG] = '{}';
    const { io } = fakeIo(files);
    expect(
      run(args('stack', { from: '/ailleurs/node_modules/@paulperigault/astro' }), { io }),
    ).toBe(0);
    expect(JSON.parse(files[PKG]).dependencies).toEqual({ '@paulperigault/astro': '9.9.9' });
  });
});
