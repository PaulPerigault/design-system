import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Grid from '../src/layout/Grid.astro';
import { renderDom } from './render';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;
const TAGS = ['div', 'ul', 'ol', 'section'] as const;
const MINS = {
  narrow: 'calc(var(--pp-size-measure) / 3)',
  medium: 'calc(var(--pp-size-measure) / 2)',
  wide: 'calc(var(--pp-size-measure) * 0.75)',
} as const;

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Grid, { props, slot });
  const element = document.querySelector('.pp-grid');
  if (!element) throw new Error('racine .pp-grid absente');
  return element;
};

describe('Grid (rendu)', () => {
  it('rend un div avec data-space="m" et data-min="medium" par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-space')).toBe('m');
    expect(element.getAttribute('data-min')).toBe('medium');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    const element = await root({ space });
    expect(element.getAttribute('data-space')).toBe(space);
  });

  it.each(Object.keys(MINS))('reporte min="%s" dans data-min', async (min) => {
    const element = await root({ min });
    expect(element.getAttribute('data-min')).toBe(min);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<p>un</p><p>deux</p>');
    expect(element.querySelectorAll('p')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-grid', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-grid')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Grid, { props: { min: 'wide' }, slot: '<p>x</p>' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Grid (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Grid.astro', import.meta.url), 'utf8');

  it.each(SPACES)('mappe data-space="%s" vers var(--pp-space-%s)', (space) => {
    const rule = new RegExp(
      `\\.pp-grid\\[data-space='${space}'\\]\\s*\\{\\s*--grid-space:\\s*var\\(--pp-space-${space}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it.each(Object.entries(MINS))('mappe data-min="%s" vers %s', (min, value) => {
    const rule = new RegExp(
      `\\.pp-grid\\[data-min='${min}'\\]\\s*\\{\\s*--grid-min:\\s*${escape(value)};`,
    );
    expect(source).toMatch(rule);
  });

  it('déclare la grille intrinsèque', () => {
    expect(source).toContain(
      'grid-template-columns: repeat(auto-fit, minmax(min(var(--grid-min), 100%), 1fr));',
    );
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-grid > :global(*)');
  });
});
