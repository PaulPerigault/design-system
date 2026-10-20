import { parseArgs } from 'node:util';
import { describe, expect, it } from 'vitest';
import { parseErrorMessage, runCommand } from '../src/cli-errors.mjs';
import { main } from '../src/cli.mjs';
import { fakeIo, fakePackage } from './fake-io.mjs';

const stack = { name: 'stack', files: [{ path: 'packages/astro/src/layout/Stack.astro' }] };

/** Projet en mémoire avec le paquet astro installé ; aucun gabarit (inutile hors create). */
function setup() {
  const fake = fakeIo(fakePackage({ '/projet/package.json': '{}\n' }, [stack]));
  const cli = (...argv) => main(argv, { io: fake.io, templatesRoot: '/absent', version: '0.0.0' });
  return { ...fake, cli };
}

/** Erreur réelle de `parseArgs` pour `args`. */
function parseError(args, options = { out: { type: 'string', short: 'o' } }) {
  try {
    parseArgs({ args, options, strict: true, allowPositionals: false });
  } catch (error) {
    return error;
  }
  throw new Error(`parseArgs a accepté ${args.join(' ')}`);
}

describe('cli : --force transmis à eject', () => {
  it('second eject sans --force : refusé (1), rien de réécrit', () => {
    const { cli, files, err } = setup();
    expect(cli('eject', 'stack')).toBe(0);
    files['/projet/src/components/pp/layout/Stack.astro'] = 'retouche\n';
    expect(cli('eject', 'stack')).toBe(1);
    expect(err[0]).toContain('conflit : « stack »');
    expect(files['/projet/src/components/pp/layout/Stack.astro']).toBe('retouche\n');
  });

  it('second eject avec --force : accepté (0), copie rétablie', () => {
    const { cli, files, err } = setup();
    expect(cli('eject', 'stack')).toBe(0);
    files['/projet/src/components/pp/layout/Stack.astro'] = 'retouche\n';
    expect(cli('eject', 'stack', '--force')).toBe(0);
    expect(files['/projet/src/components/pp/layout/Stack.astro']).toBe('<!-- stack -->\n');
    expect(err).toEqual([]);
  });
});

describe('cli : --from transmis à eject et diff', () => {
  it('eject --from ailleurs : code 2, chemin résolu dans le message', () => {
    const { cli, err } = setup();
    expect(cli('eject', 'stack', '--from', 'ailleurs')).toBe(2);
    expect(err[0]).toContain('/projet/ailleurs');
  });

  it('diff --from ailleurs : code 2, chemin résolu dans le message', () => {
    const { cli, err } = setup();
    expect(cli('eject', 'stack')).toBe(0);
    expect(cli('diff', 'stack', '--from', 'ailleurs')).toBe(2);
    expect(err[0]).toContain('/projet/ailleurs');
  });

  it('diff sans éjection préalable : code 2', () => {
    const { cli, err } = setup();
    expect(cli('diff', 'stack')).toBe(2);
    expect(err[0]).toContain('élément non éjecté');
  });
});

describe('parseErrorMessage : erreurs de parseArgs en français', () => {
  it.each([
    [['--bogus'], 'option inconnue : --bogus'],
    [['-o'], 'valeur manquante pour --out'],
    [['x'], 'argument inattendu : x'],
  ])('%j → %s', (args, message) => {
    expect(parseErrorMessage(parseError(args))).toContain(message);
  });

  it('booléen avec valeur', () => {
    const error = parseError(['--seul=oui'], { seul: { type: 'boolean' } });
    expect(parseErrorMessage(error)).toBe('--seul ne prend pas de valeur');
  });

  it('code inconnu ou absent : message d’origine', () => {
    const error = Object.assign(new Error("Option 'x' ailleurs"), { code: 'ERR_AUTRE' });
    expect(parseErrorMessage(error)).toBe("Option 'x' ailleurs");
    expect(parseErrorMessage(new Error('brut'))).toBe('brut');
    expect(parseErrorMessage('chaîne')).toBe('chaîne');
  });

  it('code connu sans segment entre apostrophes : message d’origine', () => {
    const error = Object.assign(new Error('sans nom'), { code: 'ERR_PARSE_ARGS_UNKNOWN_OPTION' });
    expect(parseErrorMessage(error)).toBe('sans nom');
  });
});

describe('runCommand', () => {
  it('rend le code de la commande, ou 2 avec le message si elle lève', () => {
    const { io, err } = fakeIo({});
    expect(runCommand(io, () => 1)).toBe(1);
    expect(
      runCommand(io, () => {
        throw new Error('panne');
      }),
    ).toBe(2);
    expect(err).toEqual(['panne']);
  });
});
