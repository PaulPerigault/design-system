import { describe, expect, it } from 'vitest';
import {
  listSources,
  parseArgs,
  run,
  tokenNames,
  unknownReferences,
  unusedTokens,
} from '../src/check-tokens.ts';

const names = ['--pp-color-fg', '--pp-space-2'];

describe('tokenNames', () => {
  it('réunit les noms des thèmes et de base', () => {
    const json = {
      themes: { light: { '--pp-a': {} }, dark: { '--pp-a': {} } },
      base: { '--pp-b': 1 },
    };
    expect([...tokenNames(json)].sort()).toEqual(['--pp-a', '--pp-b']);
  });
});

describe('unknownReferences', () => {
  it('signale une faute de frappe avec fichier et ligne', () => {
    const texts = [{ file: 'a.css', text: 'a {\n  color: var(--pp-color-fgg);\n}' }];
    expect(unknownReferences(texts, names)).toEqual([
      { file: 'a.css', line: 2, name: '--pp-color-fgg' },
    ]);
  });

  it('accepte les tokens connus, les replis et les variables locales', () => {
    const text = '.x { --pp-local: 1; margin: var(--pp-local) var( --pp-space-2, 0); }';
    expect(unknownReferences([{ file: 'b.css', text }], names)).toEqual([]);
  });

  it('ignore les autres préfixes', () => {
    expect(unknownReferences([{ file: 'c.css', text: 'var(--other)' }], names)).toEqual([]);
  });
});

describe('unusedTokens', () => {
  it('liste les tokens jamais référencés', () => {
    const texts = [{ file: 'a.css', text: 'a { color: var(--pp-color-fg); }' }];
    expect(unusedTokens(texts, names)).toEqual(['--pp-space-2']);
  });
});

const tree: Record<string, string[]> = {
  '/src': ['a.css', 'notes.md', 'node_modules', 'generated', 'sub'],
  '/src/sub': ['b.ts'],
};
const dirent = (dir: string, name: string) => ({
  name,
  isDirectory: () => `${dir}/${name}` in tree || ['node_modules', 'generated'].includes(name),
});
const fakeFs = { readdirSync: (dir: string) => (tree[dir] ?? []).map((n) => dirent(dir, n)) };

describe('listSources', () => {
  it('retient les extensions sources et saute les dossiers générés', () => {
    expect(listSources('/src', fakeFs).sort()).toEqual(['/src/a.css', '/src/sub/b.ts']);
  });
});

describe('parseArgs', () => {
  it('extrait --tokens et les dossiers', () => {
    expect(parseArgs(['--tokens', 't.json', 'a', 'b'])).toEqual({
      tokens: 't.json',
      dirs: ['a', 'b'],
    });
  });

  it('refuse un appel incomplet', () => {
    expect(() => parseArgs(['a'])).toThrow(/usage/);
  });
});

describe('run', () => {
  const files: Record<string, string> = {
    't.json': JSON.stringify({ themes: { light: { '--pp-color-fg': {}, '--pp-space-2': {} } } }),
    '/src/a.css': 'a { color: var(--pp-color-fg); }',
    '/src/sub/b.ts': "const x = 'var(--pp-oops)';",
  };
  const make = () => {
    const out: string[] = [];
    const err: string[] = [];
    const io = {
      ...fakeFs,
      readFile: (f: string) => files[f] ?? '',
      out: (m: string) => void out.push(m),
      err: (m: string) => void err.push(m),
    };
    return { io, out, err };
  };

  it('retourne 1 et décrit l’erreur', () => {
    const { io, out, err } = make();
    expect(run(['--tokens', 't.json', '/src'], io)).toBe(1);
    expect(err).toEqual(['/src/sub/b.ts:1: token inconnu --pp-oops']);
    expect(out).toEqual(['avertissement : --pp-space-2 jamais utilisé']);
  });

  it('retourne 0 avec seulement des avertissements', () => {
    files['/src/sub/b.ts'] = 'const x = 1;';
    const { io, err } = make();
    expect(run(['--tokens', 't.json', '/src'], io)).toBe(0);
    expect(err).toEqual([]);
  });
});
