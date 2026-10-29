import { describe, expect, it } from 'vitest';
import { run } from '../src/commands/add.ts';
import { run as runEject } from '../src/commands/eject.ts';
import { exportsCover } from '../src/commands/exports.ts';
import { fakeIo, fakePackage } from './fake-io.mjs';

const ROOT = '/projet/node_modules/@paulperigault/astro';
const PKG = '/projet/package.json';
const stack = { name: 'stack', files: [{ path: 'packages/astro/src/layout/Stack.astro' }] };
const DEP = '"@paulperigault/astro": "1.2.3"';

function setup(manifest, exported = { './Stack.astro': './x' }) {
  const files = fakePackage({}, [stack], { version: '1.2.3' });
  files[`${ROOT}/package.json`] = JSON.stringify({ version: '1.2.3', exports: exported });
  files[PKG] = manifest;
  return fakeIo(files);
}

const add = (env) => run({ positionals: ['stack'] }, { io: env.io });

describe('add : package.json', () => {
  it('null ou tableau : message sur io.err, code 1, rien d’écrit', () => {
    for (const text of ['null', '[]']) {
      const env = setup(text);
      expect(add(env)).toBe(1);
      expect(env.err).toEqual(['package.json doit contenir un objet JSON']);
      expect(env.files[PKG]).toBe(text);
    }
  });

  it('conserve les fins de ligne CRLF', () => {
    const env = setup('{\r\n  "name": "site"\r\n}\r\n');
    expect(add(env)).toBe(0);
    const expected = `{\r\n  "name": "site",\r\n  "dependencies": {\r\n    ${DEP}\r\n  }\r\n}\r\n`;
    expect(env.files[PKG]).toBe(expected);
  });

  it('manifeste minifié : sérialisé sans indentation', () => {
    const env = setup('{"name":"site"}');
    expect(add(env)).toBe(0);
    expect(env.files[PKG]).toBe('{"name":"site","dependencies":{"@paulperigault/astro":"1.2.3"}}');
  });
});

describe('add : exports du paquet', () => {
  it('un motif de sous-chemin couvre l’export, sans avertissement', () => {
    for (const pattern of ['./*.astro', './*']) {
      const env = setup('{}', { [pattern]: './src/*' });
      expect(add(env)).toBe(0);
      expect(env.err).toEqual([]);
    }
  });

  it('un motif qui ne couvre pas, ou une cible null, garde l’avertissement', () => {
    for (const exported of [{ './*.css': './src/*' }, { './*.astro': null }]) {
      const env = setup('{}', exported);
      expect(add(env)).toBe(0);
      expect(env.err).toHaveLength(1);
    }
  });

  it('exportsCover : clé exacte, motif, champ absent', () => {
    expect(exportsCover({ './a': './a' }, './a')).toBe(true);
    expect(exportsCover({ './*.astro': './*' }, './A.astro')).toBe(true);
    expect(exportsCover({ './*.astro': './*' }, './A.css')).toBe(false);
    expect(exportsCover(undefined, './a')).toBe(false);
  });
});

describe('add et eject : paquet installé', () => {
  const lock = '/projet/pp-ds.lock.json';
  const copy = '/projet/src/components/pp/layout/Stack.astro';

  it('version absente, vide ou non chaîne → code 2, rien d’écrit', () => {
    for (const installed of [{}, { version: '' }, { version: 3 }]) {
      for (const command of [run, runEject]) {
        const env = setup('{}');
        env.files[`${ROOT}/package.json`] = JSON.stringify(installed);
        expect(command({ positionals: ['stack'] }, { io: env.io })).toBe(2);
        expect(env.err[0]).toContain('version');
        expect([env.files[PKG], env.files[lock], env.files[copy]]).toEqual([
          '{}',
          undefined,
          undefined,
        ]);
      }
    }
  });

  it('paquet absent → code 2 et « npm i @paulperigault/astro » sur io.err', () => {
    for (const command of [run, runEject]) {
      const { io, err } = fakeIo({});
      expect(command({ positionals: ['stack'] }, { io })).toBe(2);
      expect(err[0]).toContain('npm i @paulperigault/astro');
    }
  });
});
