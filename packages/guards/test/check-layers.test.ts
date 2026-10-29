import { describe, expect, it } from 'vitest';
import { cliOptions, defaults, name, run } from '../src/application/check-layers.ts';
import { importsOf } from '../src/domain/layers/imports.ts';
import { layerOfImport, layerOfPath, validateLayers } from '../src/domain/layers/layers.ts';
import { fakeIo } from './fake-io.ts';

const layers = ['tokens', 'css', 'astro'].map((layer) => ({
  name: layer,
  paths: [`packages/${layer}/src`],
  packages: [`@pp/${layer}`],
}));
const options = { ...defaults, layers, roots: ['packages'] };
const specifiers = (text: string, file: string) =>
  importsOf(text, file).map((item) => item.specifier);
const at = (text: string, file: string) =>
  importsOf(text, file).map((i) => `${i.specifier}:${i.line}`);

it('expose nom, défauts et descripteurs', () => {
  expect([name, cliOptions]).toEqual(['layers', {}]);
  expect(defaults.extensions).toEqual(['.ts', '.mjs', '.js', '.astro', '.css']);
});

describe('importsOf', () => {
  it('reconnaît chaque forme JS/TS', () => {
    const text = [
      "import a from 'a';\nimport { b } from 'b';\nimport type { C } from 'c';",
      "import 'd';\nexport * from 'e';\nexport { f } from 'f';",
      'const g = import(\'g\');\nimport {\n  h,\n} from "h";',
    ].join('\n');
    expect(specifiers(text, 'x.ts')).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });

  it('donne le numéro de ligne du spécificateur', () => {
    const text = "const x = 1;\nimport {\n  h,\n} from './h.mjs';\n\nimport('./i.mjs');";
    expect(at(text, 'x.mjs')).toEqual(['./h.mjs:4', './i.mjs:6']);
  });

  it('reconnaît @import en CSS', () => {
    const css = "@import 'a.css';\n@import url(b.css);\n@import url('c.css') layer(x);";
    expect(at(css, 'x.css')).toEqual(['a.css:1', 'b.css:2', 'c.css:3']);
  });

  it('lit seulement le frontmatter et les <script> d’un .astro', () => {
    const body = "<p>import B from 'nope'</p>\n<script>\n  import C from 'c';\n</script>";
    const astro = `---\nimport A from '../a.astro';\n---\n${body}`;
    expect(at(astro, 'x.astro')).toEqual(['../a.astro:2', 'c:6']);
  });
});

describe('résolution', () => {
  const valid = validateLayers(layers);
  const from = 'packages/astro/src/a.astro';
  const layerOf = (specifier: string) => layerOfImport(valid, from, specifier);

  it('compare par segments entiers depuis la racine', () => {
    const paths = ['packages/css/src/a.css', 'packages/css/srcx/a.css', 'o/packages/css/src/a.css'];
    expect(paths.map((path) => layerOfPath(valid, path))).toEqual([1, -1, -1]);
  });

  it('résout relatif et nom de paquet, ignore le reste', () => {
    expect(layerOf('../../css/src/b.css')).toBe(1);
    expect(layerOf('@pp/tokens/tokens.css')).toBe(0);
    expect(['@pp/astro', './local.ts'].map(layerOf)).toEqual([2, 2]);
    expect(['@pp/x', 'node:fs', '../../../../o/x.ts'].map(layerOf)).toEqual([-1, -1, -1]);
  });
});

describe('run', () => {
  const up = "import type { X } from '../../css/src/x.ts';";
  const down = "---\nimport '@pp/css/base.css';\nimport t from '../../tokens/src/t.ts';\n---";
  const free = { 'packages/other/src/free.ts': "import '@pp/astro';" };
  const good = {
    'packages/astro/src/a.astro': down,
    'packages/css/src/c.css': "@import '@pp/tokens/t.css';",
  };

  it('refuse les imports vers le haut, relatifs et par nom de paquet', () => {
    const tree = { ...good, ...free, 'packages/tokens/src/t.ts': `${up}\nexport {};` };
    tree['packages/css/src/c.css'] += "\n@import '@pp/astro/style.css';";
    const { io, err, out } = fakeIo(tree);
    expect(run(options, io)).toBe(1);
    expect(err).toEqual([
      'packages/css/src/c.css:2: la couche « css » importe « astro » (@pp/astro/style.css), sens refusé',
      'packages/tokens/src/t.ts:1: la couche « tokens » importe « css » (../../css/src/x.ts), sens refusé',
    ]);
    expect(out).toEqual(['layers : 2 problème(s) sur 4 fichiers']);
  });

  it('permet les imports vers le bas et ignore les fichiers hors couche', () => {
    expect(run(options, fakeIo({ ...good, ...free }).io)).toBe(0);
  });

  it('échoue si aucun fichier n’appartient à une couche', () => {
    const { io, err } = fakeIo(free);
    expect(run(options, io)).toBe(1);
    expect(err).toEqual([
      "layers: aucun fichier n'appartient à une couche : vérifier layers[].paths",
    ]);
  });
});
