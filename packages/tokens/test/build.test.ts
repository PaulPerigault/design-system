import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generate, run } from '../scripts/build.ts';
import { cssValue } from '../scripts/lib/css-value.ts';
import { flatten, tokenName } from '../scripts/lib/flatten.ts';
import { io, oklch, readMini, theme } from './mini.ts';

const root = new URL('../', import.meta.url);
const read = (dir: string) => (name: string) =>
  readFileSync(new URL(`${dir}/${name}`, root), 'utf8');
const real = {
  readText: read('src/tokens'),
  readTarget: read('generated'),
  writeTarget: () => undefined,
};

describe('flatten, noms et valeurs CSS', () => {
  it('aplatit en héritant du $type du groupe ; nom = --pp- + chemin joint par -', () => {
    expect(flatten(theme(oklch(1, 0, 0), oklch(0.5, 0.1, 155)))).toEqual([
      { path: ['color', 'bg'], type: 'color', value: oklch(1, 0, 0) },
      { path: ['color', 'status', 'ok'], type: 'color', value: oklch(0.5, 0.1, 155) },
    ]);
    expect(() => flatten({ a: { $value: 1 } })).toThrow(/sans \$type/);
    expect(tokenName(['color', 'status', 'passed'])).toBe('--pp-color-status-passed');
    expect(tokenName(['font', 'size', '-1'])).toBe('--pp-font-size--1');
    expect(() => tokenName(['a b'])).toThrow(TypeError);
  });

  it.each([
    ['color', oklch(0.47, 0.19, 270.7), 'oklch(47% 0.19 270.7)'],
    ['dimension', { value: 1.5, unit: 'rem' }, '1.5rem'],
    ['duration', { value: 160, unit: 'ms' }, '160ms'],
    ['fontWeight', 600, '600'],
    ['number', 1.55, '1.55'],
    ['cubicBezier', [0.2, 0, 0, 1], 'cubic-bezier(0.2, 0, 0, 1)'],
    ['fontFamily', ['Atkinson Next', 'system-ui'], "'Atkinson Next', system-ui"],
  ])('%s', (type, value, expected) => {
    expect(cssValue({ name: 'x', type, value })).toBe(expected);
  });

  it('refuse un type ou un espace colorimétrique inconnu', () => {
    expect(() => cssValue({ name: 'x', type: 'shadow', value: {} })).toThrow(/shadow/);
    expect(() => cssValue({ name: 'x', type: 'color', value: { colorSpace: 'srgb' } })).toThrow();
  });
});

describe('generate (source minimale)', () => {
  const out = generate(readMini);

  it('CSS : light-dark(), tokens de base, data-theme, mouvement réduit', () => {
    const css = out['tokens.css'] ?? '';
    expect(css).toMatch(/^\/\*.*généré.*éditer\. \*\/\n\n:root {\n {2}color-scheme: light dark;/);
    expect(css).toContain('--pp-color-bg: light-dark(oklch(100% 0 0), oklch(0% 0 0));');
    expect(css).toContain('-status-ok: light-dark(oklch(50% 0.1 155), oklch(80% 0.1 155));');
    expect(css).toContain('  --pp-font-size--1: 0.9rem;\n  --pp-space-m: 1.5rem;\n}');
    expect(css).toContain(":root[data-theme='dark'] {\n  color-scheme: dark;\n}");
    expect(css.endsWith('reduce) {\n  :root {\n    --pp-duration-base: 0ms;\n  }\n}\n')).toBe(true);
  });

  it('JSON : thèmes, base triée et themeColor', () => {
    const json = JSON.parse(out['tokens.json'] ?? '');
    const bg = { oklch: 'oklch(100% 0 0)', hex: '#ffffff' };
    expect(json.themes.light['--pp-color-bg']).toEqual(bg);
    const names = ['--pp-duration-base', '--pp-font-size--1', '--pp-space-m'];
    expect(Object.keys(json.base)).toEqual(names);
    expect(json.themeColor).toEqual({ light: '#ffffff', dark: '#000000' });
  });

  it('d.ts : noms triés, themeColor ; sorties déterministes', () => {
    const dts = out['tokens.d.ts'] ?? '';
    expect(dts).toContain("TokenName =\n  | '--pp-color-bg'\n  | '--pp-color-status-ok'\n");
    expect(dts).toContain("{ readonly light: '#ffffff'; readonly dark: '#000000' };\n");
    expect(generate(readMini)).toEqual(out);
  });
});

describe('run et --check', () => {
  it('écrit les trois fichiers, puis --check passe', () => {
    const written: Record<string, string> = {};
    expect(run({ check: false, ...io({}, written) }).code).toBe(0);
    expect(Object.keys(written)).toEqual(['tokens.css', 'tokens.json', 'tokens.d.ts']);
    expect(run({ check: true, ...io(written) })).toEqual({ code: 0, files: [] });
  });

  it('--check échoue (code 1) et liste les fichiers en dérive, sans rien écrire', () => {
    const written: Record<string, string> = {};
    const target = { 'tokens.css': generate(readMini)['tokens.css'] ?? '', 'tokens.json': '{}\n' };
    const result = run({ check: true, ...io(target, written) });
    expect(result).toEqual({ code: 1, files: ['tokens.json', 'tokens.d.ts'] });
    expect(written).toEqual({});
  });

  it('vraie source : à jour, dans le gamut (toHex lève sinon), fond sombre #14161c', () => {
    const json = JSON.parse(generate(real.readText)['tokens.json'] ?? '');
    expect(json.themeColor.dark).toBe('#14161c');
    expect(json.base['--pp-font-family-sans']).toMatch(/^'Atkinson Hyperlegible Next/);
    expect(real.readTarget('tokens.css')).toContain("sans:\n    'Atkinson Hyperlegible Next");
    expect(Object.keys(json.themes.dark)).toEqual(Object.keys(json.themes.light));
    expect(run({ check: true, ...real }).files).toEqual([]);
  });
});
