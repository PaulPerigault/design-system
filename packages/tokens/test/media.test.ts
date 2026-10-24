import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inSrgbGamut } from '../src/lib/color.ts';
import { at, componentsOf, leaves, readJson } from './helpers.ts';

const dir = new URL('../src/tokens/', import.meta.url);
const read = (name: string) => readJson(new URL(name, dir));

const base = leaves(read('base.tokens.json'));
const light = leaves(read('light.tokens.json'));
const dark = leaves(read('dark.tokens.json'));
const generatedDir = new URL('../generated/', import.meta.url);
const generated = JSON.parse(readFileSync(new URL('tokens.json', generatedDir), 'utf8'));

describe('tokens média', () => {
  it('media.radius égal à radius.surface', () => {
    const mediaRadius = base.find((leaf) => leaf.path === 'media.radius');
    const radiusSurface = base.find((leaf) => leaf.path === 'radius.surface');
    expect(mediaRadius?.value).toEqual(radiusSurface?.value);
  });

  it('media.rule égal à size.rule', () => {
    const mediaRule = base.find((leaf) => leaf.path === 'media.rule');
    const sizeRule = base.find((leaf) => leaf.path === 'size.rule');
    expect(mediaRule?.value).toEqual(sizeRule?.value);
  });

  it('budgets entiers strictement positifs', () => {
    const budgets = base.filter((leaf) => leaf.path.startsWith('media.budget'));
    expect(budgets).toHaveLength(3);
    for (const budget of budgets) {
      expect(Number.isInteger(budget.value), budget.path).toBe(true);
      expect(budget.value, budget.path).toBeGreaterThan(0);
    }
  });

  it('media.scrim.color et media.scrim.text en OKLCH et dans gamut sRGB', () => {
    const scrimColor = base.find((leaf) => leaf.path === 'media.scrim.color');
    const scrimText = base.find((leaf) => leaf.path === 'media.scrim.text');
    expect(at({ v: scrimColor?.value }, 'v.colorSpace')).toBe('oklch');
    expect(at({ v: scrimText?.value }, 'v.colorSpace')).toBe('oklch');
    expect(inSrgbGamut(componentsOf(scrimColor?.value))).toBe(true);
    expect(inSrgbGamut(componentsOf(scrimText?.value))).toBe(true);
  });

  it('media.scrim.opacity dans ]0, 1[', () => {
    const opacity = base.find((leaf) => leaf.path === 'media.scrim.opacity');
    expect(opacity?.value).toBeGreaterThan(0);
    expect(opacity?.value).toBeLessThan(1);
  });

  it('color.media-placeholder différent de color.bg dans chaque thème', () => {
    const lightBg = light.find((leaf) => leaf.path === 'color.bg');
    const lightPlaceholder = light.find((leaf) => leaf.path === 'color.media-placeholder');
    const darkBg = dark.find((leaf) => leaf.path === 'color.bg');
    const darkPlaceholder = dark.find((leaf) => leaf.path === 'color.media-placeholder');
    expect(lightPlaceholder?.value).not.toEqual(lightBg?.value);
    expect(darkPlaceholder?.value).not.toEqual(darkBg?.value);
  });

  it('tokens média dans generated/tokens.json', () => {
    expect(generated.base['--pp-media-radius']).toBeDefined();
    expect(generated.base['--pp-media-scrim-opacity']).toBeDefined();
    expect(generated.themes.light['--pp-color-media-placeholder']).toBeDefined();
    expect(generated.themes.dark['--pp-color-media-placeholder']).toBeDefined();
  });
});
