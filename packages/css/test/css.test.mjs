import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const names = ['index', 'base', 'print', 'theme'];
const sources = Object.fromEntries(names.map((n) => [n, read(`../src/${n}.css`)]));
const tokens = JSON.parse(read('../../tokens/generated/tokens.json'));
const known = new Set([
  ...Object.keys(tokens.base),
  ...Object.keys(tokens.themes.light),
  ...Object.keys(tokens.themes.dark),
]);
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const code = (name) => stripComments(sources[name]);

describe.each(names)('%s.css', (name) => {
  it('ne référence que des variables --pp-* existantes', () => {
    const used = [...code(name).matchAll(/var\(\s*(--pp-[\w-]+)/g)].map((m) => m[1]);
    for (const variable of used) expect(known.has(variable), variable).toBe(true);
  });

  it('ne contient aucune couleur littérale ni px hors 0', () => {
    expect(code(name)).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i);
    expect(code(name)).not.toMatch(/(?<![\w.-])(?:[1-9]\d*|0?\.\d+)px\b/);
  });

  it('utilise uniquement des propriétés logiques', () => {
    const sides =
      '(?:margin|padding|inset|border|scroll-margin|scroll-padding)-(?:left|right|top|bottom)';
    const physical = `(?:^|[\\s;{])(?:${sides}|(?:min-|max-)?(?:width|height)|left|right|top|bottom)\\s*:`;
    expect(code(name)).not.toMatch(new RegExp(physical, 'm'));
    expect(code(name)).not.toMatch(/shadow\s*:|gradient\(|backdrop-filter/);
  });
});

describe('index.css', () => {
  it('importe tokens, polices, base et impression, sans tailwindcss ni thème', () => {
    const imports = [...code('index').matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
    const local = ['fonts', 'base', 'print'].map((n) => `./${n}.css`);
    expect(imports).toEqual(['@paulperigault/tokens/tokens.css', ...local]);
  });
});

describe('base.css', () => {
  const css = code('base');

  it('applique fond, texte, famille, corps et interligne', () => {
    const roles = ['color-bg', 'color-fg', 'font-family-sans', 'font-size-0'];
    for (const v of [...roles, 'font-line-height-body', 'font-line-height-heading']) {
      expect(css).toContain(`var(--pp-${v})`);
    }
    expect(css).toMatch(/text-wrap: balance[\s\S]*text-wrap: pretty/);
  });

  it('définit le focus visible avec les tokens de focus', () => {
    expect(css).toContain('outline: var(--pp-size-focus-width) solid var(--pp-color-focus);');
    expect(css).toContain('outline-offset: var(--pp-size-focus-offset);');
  });

  it('limite le défilement doux à no-preference', () => {
    expect(css).toMatch(/no-preference\)\s*{\s*html\s*{\s*scroll-behavior: smooth/);
    expect(css.match(/scroll-behavior: smooth/g)).toHaveLength(1);
  });

  it('neutralise animations et transitions sous reduce', () => {
    const reduce = css.slice(css.indexOf('prefers-reduced-motion: reduce'));
    expect(reduce).toMatch(/\*,\s*::before,\s*::after/);
    expect(reduce).toMatch(/animation-duration:\s*0s/);
    expect(reduce).toMatch(/transition-duration:\s*0s/);
  });
});

describe('print.css', () => {
  const css = code('print');

  it('force le thème clair', () => {
    expect(css).toMatch(/:root,\s*:root\[data-theme='light'\],\s*:root\[data-theme='dark'\]/);
    expect(css).toContain('color-scheme: light');
  });

  it('affiche l’adresse des liens externes et évite les coupures', () => {
    expect(css).toContain("content: ' (' attr(href) ')'");
    expect(css).toMatch(/li,\s*figure,\s*pre,\s*table\s*{\s*break-inside:\s*avoid/);
  });
});

describe('theme.css', () => {
  const css = code('theme');

  it('réinitialise les valeurs par défaut de Tailwind', () => {
    for (const ns of ['color', 'font', 'text', 'shadow', 'drop-shadow', 'radius', 'spacing']) {
      expect(css).toContain(`--${ns}-*: initial;`);
    }
  });

  it('déclare la variante js et le thème inline', () => {
    expect(css).toMatch(/@custom-variant js \(:root\.js &\);[\s\S]*@theme inline {/);
  });

  it('expose chaque rôle de couleur, y compris les statuts', () => {
    for (const variable of Object.keys(tokens.themes.light)) {
      const role = variable.replace(/^--pp-(color-)?/, '');
      expect(css).toContain(`--color-${role}: var(${variable});`);
    }
  });

  it('expose polices, échelle, espacements, rayons et conteneurs', () => {
    for (const line of [
      '--font-sans: var(--pp-font-family-sans);',
      '--text-sm: var(--pp-font-size--1);',
      '--text-4xl: var(--pp-font-size-4);',
      '--spacing-3xl: var(--pp-space-3xl);',
      '--radius-surface: var(--pp-radius-surface);',
      '--container-measure: var(--pp-size-measure);',
    ]) {
      expect(css).toContain(line);
    }
  });
});
