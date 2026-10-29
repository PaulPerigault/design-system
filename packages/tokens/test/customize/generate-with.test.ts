import { describe, expect, it } from 'vitest';
import { generateWith } from '../../scripts/build.ts';
import { inSrgbGamut, parseOklch } from '../../src/lib/color.ts';
import { contrastRatio } from '../../src/lib/contrast.ts';
import { readGenerated, readSource, TWELVE_HUES } from './helpers.ts';

const COLOR_LINE = /^\s*(--pp-[a-z0-9-]+): light-dark\((oklch\([^)]*\)), (oklch\([^)]*\))\);$/gm;

function colors(css: string): Map<string, [string, string]> {
  const found = [...css.matchAll(COLOR_LINE)];
  return new Map(found.map(([, name = '', light = '', dark = '']) => [name, [light, dark]]));
}

function build(input: Parameters<typeof generateWith>[1]): Record<string, string> {
  const result = generateWith(readSource, input);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

const isDerived = (name: string): boolean =>
  ['--pp-color-accent', '--pp-color-focus', '--pp-color-status-running'].includes(name) ||
  name.startsWith('--pp-chart-');

describe('generateWith : teinte d’accent', () => {
  const reference = colors(readGenerated('tokens.css'));

  it.each(TWELVE_HUES)('teinte %s : seules les variables dérivées changent', (hue) => {
    const css = colors(build({ accentHue: hue })['tokens.css'] ?? '');
    expect([...css.keys()]).toEqual([...reference.keys()]);
    for (const [name, pair] of css) {
      if (!isDerived(name)) expect(pair).toEqual(reference.get(name));
    }
  });

  it.each(TWELVE_HUES)('teinte %s : accent à la teinte demandée, texte dessus 4,5:1', (hue) => {
    const css = colors(build({ accentHue: hue })['tokens.css'] ?? '');
    const accent = css.get('--pp-color-accent') ?? ['', ''];
    const onAccent = css.get('--pp-color-on-accent') ?? ['', ''];
    for (const index of [0, 1]) {
      const color = parseOklch(accent[index] ?? '');
      expect(color.h).toBeCloseTo(hue, 6);
      expect(inSrgbGamut(color)).toBe(true);
      expect(contrastRatio(parseOklch(onAccent[index] ?? ''), color)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('tokens.json et tokens.css disent la même couleur (hexadécimal compris)', () => {
    const files = build({ accentHue: 145 });
    const json = JSON.parse(files['tokens.json'] ?? '{}');
    const reference = JSON.parse(readGenerated('tokens.json'));
    const css = colors(files['tokens.css'] ?? '');
    expect(json.themes.light['--pp-color-accent'].oklch).toBe(css.get('--pp-color-accent')?.[0]);
    expect(json.themes.dark['--pp-chart-3'].oklch).toBe(css.get('--pp-chart-3')?.[1]);
    expect(json.themes.light['--pp-color-accent'].hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(json.themes.light['--pp-color-bg']).toEqual(reference.themes.light['--pp-color-bg']);
  });

  it('les noms de variables ne changent pas (tokens.d.ts identique)', () => {
    expect(build({ accentHue: 145 })['tokens.d.ts']).toBe(readGenerated('tokens.d.ts'));
  });
});

describe('generateWith : pile de police', () => {
  const stack = "'Inter Variable', 'Inter Fallback', system-ui, sans-serif";
  const mono = (text: string) => /--pp-font-family-mono:[^;]*;/.exec(text)?.[0];

  it('dérive --pp-font-family-sans, laisse --pp-font-family-mono', () => {
    const css = build({ fontStack: stack })['tokens.css'] ?? '';
    expect(css).toContain(`--pp-font-family-sans: ${stack};`);
    expect(mono(css)).toBe(mono(readGenerated('tokens.css')));
  });

  it('une pile longue passe à la ligne comme le fait Prettier', () => {
    const long = ['Inter Variable', 'Inter Fallback', 'Helvetica Neue', 'Arial', 'Roboto']
      .map((family) => `'${family}'`)
      .join(', ');
    const css = build({ fontStack: `${long}, system-ui, sans-serif` })['tokens.css'] ?? '';
    const wrapped = ['--pp-font-family-sans:', `    ${long}, system-ui, sans-serif;`];
    expect(css).toContain(wrapped.join('\n'));
  });

  it('les deux entrées se combinent', () => {
    const css = build({ accentHue: 145, fontStack: 'Inter, sans-serif' })['tokens.css'] ?? '';
    expect(css).toContain('Inter, sans-serif;');
    expect(css).not.toBe(readGenerated('tokens.css'));
  });
});

describe('generateWith : sources incomplètes', () => {
  it('rend une erreur typée quand les sources n’ont pas d’accent', () => {
    const empty = { sets: {}, modifiers: { theme: { contexts: { light: [], dark: [] } } } };
    const minimal = (name: string): string =>
      name === 'resolver.json' ? JSON.stringify(empty) : '{}';
    expect(generateWith(minimal, { accentHue: 145 })).toMatchObject({
      ok: false,
      error: { code: 'build.derivation-failed' },
    });
  });
});
