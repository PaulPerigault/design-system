import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { at, leaves, readJson } from './helpers.ts';

const src = new URL('../src/', import.meta.url);
const read = (path: string) => readJson(new URL(path, src));
const THEMES = ['light', 'dark'] as const;
const DIRECTIONS = ['encre', 'blueprint', 'runbook', 'signal'] as const;

describe('--pp-color-accent-text', () => {
  it.each(THEMES)('%s : valeur initiale égale à l’accent', (theme) => {
    const source = read(`tokens/${theme}.tokens.json`);
    expect(at(source, 'color.accent-text.$value')).toEqual(at(source, 'color.accent.$value'));
  });

  it.each(DIRECTIONS.flatMap((name) => THEMES.map((theme) => ({ name, theme }))))(
    'direction $name, $theme : accent-text suit l’accent de la direction',
    ({ name, theme }) => {
      const source = read(`directions/${name}.tokens.json`);
      expect(at(source, `${theme}.accent-text.$value`)).toEqual(
        at(source, `${theme}.accent.$value`),
      );
    },
  );
});

describe('--pp-size-prose', () => {
  it('valeur initiale égale à --pp-size-measure, deux jetons distincts', () => {
    const base = leaves(read('tokens/base.tokens.json'));
    const value = (path: string) => base.find((leaf) => leaf.path === path)?.value;
    expect(value('size.prose')).toBeDefined();
    expect(value('size.prose')).toEqual(value('size.measure'));
  });
});
