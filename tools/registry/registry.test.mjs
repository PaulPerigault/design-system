import { describe, expect, it } from 'vitest';
import { run } from './build.mjs';
import { knownTokens, registryIndex, tokensOf, uncovered, withTokens } from './registry.mjs';

const KNOWN = new Set(['--pp-space-s', '--pp-color-fg', '--pp-size-page']);

describe('tokensOf', () => {
  it('garde les noms de tokens.json, par var() ou par nom, triés et uniques', () => {
    const texts = [
      'a { gap: var(--pp-space-s); color: var(--pp-color-fg); }',
      "remOf('--pp-size-page')",
    ];
    expect(tokensOf([...texts, 'b { gap: var(--pp-space-s); }'], KNOWN)).toEqual([
      '--pp-color-fg',
      '--pp-size-page',
      '--pp-space-s',
    ]);
  });

  it('écarte les propriétés locales et les préfixes incomplets', () => {
    expect(tokensOf(['--pp-local: 1px; --pp-ratio-${r}; var(--stack-space)'], KNOWN)).toEqual([]);
  });
});

describe('knownTokens', () => {
  it('réunit les valeurs de base et les rôles de chaque thème', () => {
    const json = {
      base: { '--pp-a': '1' },
      themes: { light: { '--pp-c': 'x' }, dark: { '--pp-c': 'y' } },
    };
    expect([...knownTokens(json)].sort()).toEqual(['--pp-a', '--pp-c']);
  });
});

describe('withTokens', () => {
  const item = { name: 'x', files: [{ path: 'a.astro' }], meta: { version: '0.0.0' } };

  it('recalcule meta.tokens et garde le reste de meta', () => {
    const result = withTokens(item, { read: () => 'var(--pp-space-s)', known: KNOWN });
    expect(result.meta).toEqual({ version: '0.0.0', tokens: ['--pp-space-s'] });
  });

  it('lève si un fichier déclaré manque', () => {
    expect(() => withTokens(item, { read: () => undefined, known: KNOWN })).toThrow(
      /absent a.astro/,
    );
  });
});

describe('uncovered', () => {
  it('signale chaque export .astro sans fragment, ignore les autres exports', () => {
    const exports = {
      './A.astro': './src/A.astro',
      './B.astro': './src/B.astro',
      './lib': './src/lib.ts',
    };
    const items = [{ files: [{ path: 'packages/astro/src/A.astro' }] }];
    expect(uncovered(exports, items, 'packages/astro/')).toEqual(['./B.astro']);
  });
});

describe('registryIndex', () => {
  it('trie par nom et retire le $schema des éléments', () => {
    const index = registryIndex([{ name: 'b', $schema: 's' }, { name: 'a' }], {
      name: 'p',
      homepage: 'h',
    });
    expect(index.items).toEqual([{ name: 'a' }, { name: 'b' }]);
    expect(index).toMatchObject({ name: 'p', homepage: 'h' });
  });
});

describe('registre du dépôt', () => {
  it('à jour : meta.tokens, index et couverture des exports', async () => {
    expect((await run(process.cwd(), { check: true })).problems).toEqual([]);
  });
});
