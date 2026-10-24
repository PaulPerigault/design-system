import { existsSync, readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inSrgbGamut, oklchToSrgb, toHex } from '../src/lib/color.ts';
import { at, componentsOf, leaves, readJson } from './helpers.ts';

const dir = new URL('../src/tokens/', import.meta.url);
const read = (name: string) => readJson(new URL(name, dir));
const TYPES = new Set([
  'color',
  'fontFamily',
  'fontWeight',
  'dimension',
  'number',
  'duration',
  'cubicBezier',
]);

const base = leaves(read('base.tokens.json'));
const light = leaves(read('light.tokens.json'));
const dark = leaves(read('dark.tokens.json'));

describe('source DTCG', () => {
  it.each([
    ['base', base],
    ['light', light],
    ['dark', dark],
  ])('%s : chaque feuille a un $type connu et une $value', (_name, list) => {
    expect(list.length).toBeGreaterThan(0);
    for (const leaf of list) {
      expect(TYPES.has(leaf.type), leaf.path).toBe(true);
      expect(leaf.value, leaf.path).toBeDefined();
    }
  });

  it('les deux thèmes ont les mêmes chemins de couleur', () => {
    expect(dark.map((leaf) => leaf.path)).toEqual(light.map((leaf) => leaf.path));
    expect(light).toHaveLength(14);
  });

  it('chaque couleur est en OKLCH et dans le gamut sRGB', () => {
    for (const leaf of [...light, ...dark]) {
      expect(at({ v: leaf.value }, 'v.colorSpace'), leaf.path).toBe('oklch');
      expect(inSrgbGamut(componentsOf(leaf?.value)), leaf.path).toBe(true);
    }
  });

  it("color.bg sombre est l'encre du favicon", () => {
    const bg = dark.find((leaf) => leaf.path === 'color.bg');
    const color = componentsOf(bg?.value);
    expect(Object.values(oklchToSrgb(color)).every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(toHex(color)).toBe('#14161c');
  });

  it('les échelles de base ont les valeurs imposées', () => {
    const byPath = Object.fromEntries(base.map((leaf) => [leaf.path, leaf.value]));
    expect(byPath['font.size.0']).toEqual({ value: 1.125, unit: 'rem' });
    expect(byPath['size.rule']).toEqual({ value: 1, unit: 'px' });
    expect(byPath['duration.base']).toEqual({ value: 160, unit: 'ms' });
    expect(byPath['easing.standard']).toEqual([0.2, 0, 0, 1]);
  });
});

interface Resolver {
  version: string;
  sets: Record<string, { sources: string[] }>;
  modifiers: Record<string, { default: string; contexts: Record<string, string[]> }>;
}

describe('resolver', () => {
  const resolver: Resolver = JSON.parse(readFileSync(new URL('resolver.json', dir), 'utf8'));
  const files = [
    ...Object.values(resolver.sets).flatMap((set) => set.sources),
    ...Object.values(resolver.modifiers).flatMap((modifier) =>
      Object.values(modifier.contexts).flat(),
    ),
  ];

  it('déclare la version 2025.10 et le thème clair par défaut', () => {
    expect(resolver.version).toBe('2025.10');
    expect(resolver.modifiers.theme?.default).toBe('light');
    expect(Object.keys(resolver.modifiers.theme?.contexts ?? {})).toEqual(['light', 'dark']);
  });

  it('référence des fichiers qui existent', () => {
    expect(files).toHaveLength(3);
    for (const file of files) expect(existsSync(new URL(file, dir)), file).toBe(true);
  });
});
