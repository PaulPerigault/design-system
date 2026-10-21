import { describe, expect, it } from 'vitest';
import { main, USAGE } from '../src/cli.mjs';
import { fakeIo, fakePackage } from './fake-io.mjs';

const TEMPLATES = '/pp/templates';
const VERSION = '4.5.6';
const stack = { name: 'stack', files: [{ path: 'packages/astro/src/layout/Stack.astro' }] };
const DEPS = ['@commitlint/cli', '@commitlint/config-conventional', 'astro', 'husky'];
const PP_DEPS = ['css', 'guards', 'tokens'].map((name) => `@paulperigault/${name}`);
const versions = Object.fromEntries([...DEPS, ...PP_DEPS].map((name) => [name, '1.0.0']));

/** Projet avec manifeste, paquet astro installé et gabarit, tout en mémoire. */
function setup({ templatesRoot = TEMPLATES } = {}) {
  const files = fakePackage(
    {
      '/projet/package.json': '{\n  "name": "site"\n}\n',
      [`${TEMPLATES}/site/src/pages/index.astro`]: '<h1>Essai</h1>\n',
      [`${TEMPLATES}/versions.json`]: JSON.stringify(versions),
    },
    [stack],
  );
  const fake = fakeIo(files);
  const cli = (...argv) => main(argv, { io: fake.io, templatesRoot, version: VERSION });
  return { ...fake, before: { ...files }, cli };
}

describe('cli : dispatch', () => {
  it('create <dossier> écrit le site', () => {
    const { cli, files, err } = setup();
    expect(cli('create', 'mon-site')).toBe(0);
    expect(files['/projet/mon-site/src/pages/index.astro']).toBe('<h1>Essai</h1>\n');
    expect(JSON.parse(files['/projet/mon-site/package.json']).name).toBe('mon-site');
    expect(err).toEqual([]);
  });

  it('raccourci : un seul positionnel inconnu vaut create, --dry-run transmis', () => {
    const { cli, files, before, out } = setup();
    expect(cli('mon-site', '--dry-run')).toBe(0);
    expect(out).toContain('créerait mon-site/package.json');
    expect(files).toEqual(before);
  });

  it('add <élément> --dry-run : plan et import, sans écrire', () => {
    const { cli, files, before, out } = setup();
    expect(cli('add', 'stack', '--dry-run')).toBe(0);
    const line = "import Stack from '@paulperigault/astro/Stack.astro';";
    expect(out).toEqual(['écraserait package.json', line]);
    expect(files).toEqual(before);
  });

  it('eject <élément> --out --force, puis diff <élément>', () => {
    const { cli, files, out } = setup();
    expect(cli('eject', 'stack', '--out', 'src/ds', '--force')).toBe(0);
    expect(files['/projet/src/ds/layout/Stack.astro']).toBe('<!-- stack -->\n');
    expect(cli('diff', 'stack')).toBe(0);
    expect(out.at(-1)).toBe('stack : identique au paquet');
  });

  it('--from est transmis aux commandes', () => {
    const { cli, err } = setup();
    expect(cli('add', 'stack', '--from', 'ailleurs')).toBe(2);
    expect(err[0]).toContain('/projet/ailleurs');
    expect(cli('eject', 'stack', '--from', 'node_modules/@paulperigault/astro', '--dry-run')).toBe(
      0,
    );
  });

  it('ne charge le gabarit que pour create', () => {
    const { cli } = setup({ templatesRoot: '/absent' });
    expect(['add', 'eject', 'diff'].map((name) => cli(name, 'stack'))).toEqual([0, 0, 0]);
    expect(() => cli('create', 'mon-site')).toThrow('ENOENT');
  });
});

describe('cli : aide et version', () => {
  it.each([['--help'], ['-h'], ['eject', '--help'], ['inconnu', 'x', '-h']])(
    '%s → usage sur la sortie standard, code 0',
    (...argv) => {
      const { cli, out, err } = setup();
      expect(cli(...argv)).toBe(0);
      expect([out, err]).toEqual([[USAGE], []]);
    },
  );

  it('usage : une ligne par commande, options, exemple', () => {
    for (const name of ['create', 'add', 'eject', 'diff']) expect(USAGE).toMatch(`\n  ${name} <`);
    for (const flag of ['--dry-run', '--force', '--from', '--out']) expect(USAGE).toContain(flag);
    expect(USAGE).toContain('npx @paulperigault/create eject stack');
  });

  it.each([['--version'], ['-v']])('%s → version', (flag) => {
    const { cli, out } = setup();
    expect([cli(flag), out]).toEqual([0, [VERSION]]);
  });
});

describe('cli : erreurs d’usage (code 2, usage sur la sortie d’erreur, rien d’écrit)', () => {
  it.each([
    ['option inconnue', ['add', 'stack', '--bogus'], 'option inconnue : --bogus'],
    ['option courte inconnue', ['-x'], 'option inconnue : -x'],
    ['valeur manquante', ['eject', 'stack', '--out'], 'valeur manquante pour --out'],
    ['valeur à un booléen', ['add', 'stack', '--dry-run=oui'], '--dry-run ne prend pas de valeur'],
    ['commande manquante', [], 'commande manquante'],
    ['commande inconnue', ['publier', 'stack'], 'commande inconnue : publier'],
    ['argument manquant', ['eject'], 'eject : argument <élément> manquant'],
    ['argument en trop', ['add', 'stack', 'card'], 'add : argument <élément> en trop'],
    ['--out hors eject', ['add', 'stack', '--out', 'x'], '--out ne s’applique pas à add'],
    ['--force hors eject', ['add', 'stack', '--force'], '--force ne s’applique pas à add'],
    ['--force pour diff', ['diff', 'stack', '--force'], '--force ne s’applique pas à diff'],
    ['--from pour create', ['create', 'site', '--from', 'x'], '--from ne s’applique pas à create'],
    ['--force du raccourci', ['mon-site', '--force'], '--force ne s’applique pas à create'],
  ])('%s', (_label, argv, message) => {
    const { cli, files, before, out, err } = setup();
    expect(cli(...argv)).toBe(2);
    expect(err[0]).toMatch(/^pp-create : /);
    expect(err[0]).toContain(message);
    expect(err.at(-1)).toBe(USAGE);
    expect([out, files]).toEqual([[], before]);
  });
});
