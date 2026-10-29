import { describe, expect, it } from 'vitest';
import { run } from '../src/application/commands/eject.ts';
import { sha256 } from '../src/domain/hash.ts';
import { fakeIo, fakePackage } from './fake-io.mjs';

const LOCK = '/projet/pp-ds.lock.json';
const COPY = '/projet/src/components/pp/layout/Stack.astro';
const STACK_SRC = '---\n---\n<div class="pp-stack"><slot /></div>\n';
const stack = { name: 'stack', files: [{ path: 'packages/astro/src/layout/Stack.astro' }] };
const card = {
  name: 'card',
  files: [{ path: 'packages/astro/src/Card.astro' }, { path: 'packages/astro/src/card.css' }],
};

function setup(extra = {}) {
  const sources = { 'src/layout/Stack.astro': STACK_SRC };
  const files = fakePackage({ ...extra }, [stack, card], { version: '1.2.3', sources });
  return fakeIo(files);
}

const args = (name, extra = {}) => ({ positionals: [name], ...extra });
const lockOf = (files) => JSON.parse(files[LOCK]);

describe('eject', () => {
  it('copie les fichiers sans le préfixe src/ et les inscrit au verrou', () => {
    const { io, files, out, err } = setup();
    expect(run(args('stack'), { io })).toBe(0);
    expect(files[COPY]).toBe(STACK_SRC);
    const file = { source: 'src/layout/Stack.astro', path: 'src/components/pp/layout/Stack.astro' };
    const entry = { package: '@paulperigault/astro', version: '1.2.3' };
    expect(lockOf(files)).toEqual({
      lockfileVersion: 1,
      items: { stack: { ...entry, files: [{ ...file, sha256: sha256(STACK_SRC) }] } },
    });
    expect(out).toContain("import Stack from './components/pp/layout/Stack.astro';");
    expect(out.at(-1)).toContain('diff stack');
    expect(err).toEqual([]);
  });

  it('--out choisit le dossier cible, import relatif à src/', () => {
    const { io, files, out } = setup();
    expect(run(args('card', { out: 'src/ui' }), { io })).toBe(0);
    expect(Object.keys(files).filter((f) => f.startsWith('/projet/src/'))).toEqual([
      '/projet/src/ui/Card.astro',
      '/projet/src/ui/card.css',
    ]);
    expect(lockOf(files).items.card.files.map((f) => f.path)).toEqual([
      'src/ui/Card.astro',
      'src/ui/card.css',
    ]);
    expect(out.filter((line) => line.startsWith('import '))).toEqual([
      "import Card from './ui/Card.astro';",
    ]);
    const other = setup();
    expect(run(args('stack', { out: 'lib/pp' }), { io: other.io })).toBe(0);
    expect(other.out).toContain("import Stack from '../lib/pp/layout/Stack.astro';");
  });

  it('refuse d’écraser un fichier existant, puis écrase avec --force', () => {
    const { io, files, err } = setup({ [COPY]: 'local' });
    expect(run(args('stack'), { io })).toBe(1);
    expect(err).toEqual(['conflit : src/components/pp/layout/Stack.astro existe déjà']);
    expect([files[COPY], files[LOCK]]).toEqual(['local', undefined]);
    expect(run(args('stack', { force: true }), { io })).toBe(0);
    expect(files[COPY]).toBe(STACK_SRC);
  });

  it('refuse un élément déjà au verrou en listant tous les conflits', () => {
    const { io, files, err } = setup();
    expect(run(args('stack'), { io })).toBe(0);
    const lock = files[LOCK];
    files[COPY] = 'modifié';
    expect(run(args('stack'), { io })).toBe(1);
    expect(err).toEqual([
      'conflit : « stack » figure déjà dans pp-ds.lock.json',
      'conflit : src/components/pp/layout/Stack.astro existe déjà',
    ]);
    expect([files[COPY], files[LOCK]]).toEqual(['modifié', lock]);
    expect(run(args('stack', { force: true }), { io })).toBe(0);
    expect(files[COPY]).toBe(STACK_SRC);
  });

  it('--dry-run liste sans écrire', () => {
    const { io, files, out } = setup();
    const before = { ...files };
    expect(run(args('stack', { dryRun: true }), { io })).toBe(0);
    expect(files).toEqual(before);
    expect(out.slice(0, 2)).toEqual([
      'créerait src/components/pp/layout/Stack.astro',
      'créerait pp-ds.lock.json',
    ]);
  });

  it('un second eject conserve le premier élément au verrou', () => {
    const { io, files } = setup();
    expect(run(args('stack'), { io })).toBe(0);
    expect(run(args('card'), { io })).toBe(0);
    const { items } = lockOf(files);
    expect(Object.keys(items)).toEqual(['card', 'stack']);
    expect(items.stack.files[0].sha256).toBe(sha256(STACK_SRC));
    expect(items.card.files[1].sha256).toBe(sha256('<!-- card -->\n'));
  });

  it('élément inconnu ou usage faux → code 2, verrou illisible → code 1', () => {
    const one = setup();
    expect(run(args('carte'), { io: one.io })).toBe(2);
    expect(one.err[0]).toContain('« carte » introuvable');
    expect(run({ positionals: [] }, { io: one.io })).toBe(2);
    expect(one.err[1]).toBe('usage : eject <élément>');
    const two = setup({ [LOCK]: '{nope' });
    expect(run(args('stack'), { io: two.io })).toBe(1);
    expect(two.err[0]).toContain('illisible');
  });
});
