import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import registry from '@paulperigault/astro/registry.json';
import { describe, expect, it } from 'vitest';
import { getStaticPaths } from '../pages/r/[item].json.ts';
import {
  targetOf,
  toServedIndex,
  toServedItem,
  type Registry,
  type RegistryItem,
} from './registry-serve.ts';

// apps/docs/src/lib -> racine du dépôt
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const readRepoFile = (repoPath: string): string =>
  readFileSync(resolve(repoRoot, repoPath), 'utf8');

const typedRegistry: Registry = registry;
const findItem = (name: string): RegistryItem => {
  const item = typedRegistry.items.find((candidate) => candidate.name === name);
  if (item === undefined) throw new Error(`Élément absent du registre : ${name}`);
  return item;
};

describe('targetOf', () => {
  it('range les composants Astro dans components/pp et le reste dans lib/pp', () => {
    expect(targetOf('packages/astro/src/forms/Button.astro')).toBe('components/pp/Button.astro');
    expect(targetOf('packages/astro/src/forms/button-variants.ts')).toBe(
      'lib/pp/button-variants.ts',
    );
    expect(targetOf('packages/astro/src/media/frame.css')).toBe('lib/pp/frame.css');
  });
});

describe('toServedItem', () => {
  it('sert button avec le contenu en ligne et la cible de chaque fichier', () => {
    const served = toServedItem(findItem('button'), readRepoFile);
    expect(served.name).toBe('button');
    expect(served.files).toHaveLength(2);
    for (const file of served.files) {
      expect(file.content.length).toBeGreaterThan(0);
    }
    expect(served.files[0]?.target).toBe('components/pp/Button.astro');
    expect(served.files[1]?.target).toBe('lib/pp/button-variants.ts');
  });

  it('lève une erreur claire quand un fichier du registre est absent', () => {
    const item: RegistryItem = {
      ...findItem('button'),
      files: [{ path: 'packages/astro/src/absent/Absent.astro', type: 'registry:ui' }],
    };
    expect(() => toServedItem(item, readRepoFile)).toThrow(
      'Fichier du registre illisible : packages/astro/src/absent/Absent.astro',
    );
  });
});

describe('toServedIndex', () => {
  it('garde les champs de l’index et retire le contenu des fichiers', () => {
    const index = toServedIndex(typedRegistry);
    const button = index.items.find((item) => item.name === 'button');
    expect(button).toEqual({
      name: 'button',
      type: 'registry:ui',
      title: 'Button',
      description: findItem('button').description,
      files: [
        { path: 'packages/astro/src/forms/Button.astro', type: 'registry:ui' },
        { path: 'packages/astro/src/forms/button-variants.ts', type: 'registry:lib' },
      ],
    });
    expect(index.items).toHaveLength(typedRegistry.items.length);
  });
});

describe('routes /r/', () => {
  it('a une route pour chaque nom de l’index', () => {
    const routes = getStaticPaths().map((path) => path.params.item);
    const names = toServedIndex(typedRegistry).items.map((item) => item.name);
    expect(routes.sort()).toEqual(names.sort());
  });
});
