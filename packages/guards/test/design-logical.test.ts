import { describe, expect, it } from 'vitest';
import { analyze, RULE_IDS } from '../src/design/rules.ts';

const ALL = new Set(RULE_IDS);
const rulesOf = (file: string, text: string) => analyze(file, text, ALL).map((p) => p.rule);
const css = (text: string) => rulesOf('a.css', text);
const markup = (text: string) => rulesOf('a.astro', text);
const PHYSICAL = 'physical-property';

describe('physical-property', () => {
  it.each([
    'margin-left: 0',
    'padding-top: var(--pp-space-s)',
    'border-right: var(--x) solid var(--y)',
    'border-bottom-width: var(--x)',
    'border-top-left-radius: var(--x)',
    'width: 100%',
    'max-height: var(--x)',
    'min-width: 0',
    'left: 0',
    'overflow-x: auto',
    'text-align: right',
    'float: left',
  ])('refuse « %s »', (declaration) => {
    expect(css(`a { ${declaration}; }`)).toEqual([PHYSICAL]);
  });

  it.each([
    'margin-inline-start: 0',
    'padding-block: var(--pp-space-s)',
    'border-inline-end: var(--x) solid var(--y)',
    'border-start-start-radius: var(--x)',
    'inline-size: 100%',
    'max-block-size: var(--x)',
    'inset-inline-start: 0',
    'inset: 0',
    'overflow-inline: auto',
    'text-align: start',
    'object-position: left top',
    'border-radius: var(--x)',
  ])('permet « %s »', (declaration) => {
    expect(css(`a { ${declaration}; }`)).toEqual([]);
  });

  it('ignore les conditions @media et @container', () => {
    expect(css('@container (min-width: 28.5rem) { a { gap: var(--x); } }')).toEqual([]);
    expect(css('@media (max-width: 38rem) { a { inline-size: 100%; } }')).toEqual([]);
  });

  it('en .astro : seulement les <style>, jamais les attributs ni le frontmatter', () => {
    const page = `---
const size = { width: 600, height: 400 };
---
<svg width="100%" height="100%"></svg>
<style>a { height: 1px; }</style>`;
    expect(markup(page)).toEqual([PHYSICAL]);
  });

  it('message avec l’équivalent logique', () => {
    const [problem] = analyze('a.css', 'a { margin-left: 0; }', ALL);
    expect(problem?.message).toMatch(/logique/);
  });

  it.each([
    'ml-2',
    'md:pr-4',
    '-left-1',
    'right-0',
    'text-left',
    'rounded-l-md',
    'rounded-tr',
    'border-r-2',
    'float-right',
    'scroll-pl-4',
  ])('classe Tailwind physique refusée : %s', (utility) =>
    expect(markup(`<p class="${utility}">`)).toEqual([PHYSICAL]),
  );

  it.each([
    'ms-2',
    'pe-4',
    'start-0',
    'text-start',
    'rounded-s-md',
    'border-e-2',
    'border-line',
    'rounded-lg',
    'mt-2',
    'mx-auto',
    'leading-tight',
  ])('classe logique ou neutre permise : %s', (utility) =>
    expect(markup(`<p class="${utility}">`)).toEqual([]),
  );
});
