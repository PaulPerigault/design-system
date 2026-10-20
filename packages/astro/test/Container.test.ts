import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Container from '../src/layout/Container.astro';
import { renderDom } from './render';

const WIDTHS = { page: 'size-page', measure: 'size-measure' } as const;
const GUTTERS = ['s', 'm', 'l'] as const;
const TAGS = ['div', 'section', 'main', 'header', 'footer', 'article'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Container, { props, slot });
  const element = document.querySelector('.pp-container');
  if (!element) throw new Error('racine .pp-container absente');
  return element;
};

describe('Container (rendu)', () => {
  it('rend un div avec data-width="page" et data-gutter="s" par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-width')).toBe('page');
    expect(element.getAttribute('data-gutter')).toBe('s');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(Object.keys(WIDTHS))('reporte width="%s" dans data-width', async (width) => {
    const element = await root({ width });
    expect(element.getAttribute('data-width')).toBe(width);
  });

  it.each(GUTTERS)('reporte gutter="%s" dans data-gutter', async (gutter) => {
    const element = await root({ gutter });
    expect(element.getAttribute('data-gutter')).toBe(gutter);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<p>un</p><p>deux</p>');
    expect(element.querySelectorAll('p')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-container', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-container')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Container, {
      props: { width: 'measure', gutter: 'l' },
      slot: '<p>x</p>',
    });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Container (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Container.astro', import.meta.url), 'utf8');

  it.each(Object.entries(WIDTHS))('mappe data-width="%s" vers var(--pp-%s)', (width, token) => {
    const rule = new RegExp(
      `\\.pp-container\\[data-width='${width}'\\]\\s*\\{\\s*--container-width:\\s*var\\(--pp-${token}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it.each(GUTTERS)('mappe data-gutter="%s" vers var(--pp-space-%s)', (gutter) => {
    const rule = new RegExp(
      `\\.pp-container\\[data-gutter='${gutter}'\\]\\s*\\{\\s*--container-gutter:\\s*var\\(--pp-space-${gutter}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('centre une boîte content-box en propriétés logiques', () => {
    expect(source).toContain('box-sizing: content-box;');
    expect(source).toContain('margin-inline: auto;');
    expect(source).toContain('max-inline-size: var(--container-width);');
    expect(source).toContain('padding-inline: var(--container-gutter);');
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-container > :global(*)');
  });
});
