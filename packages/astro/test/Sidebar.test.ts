import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Sidebar from '../src/layout/Sidebar.astro';
import { renderDom } from './render';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;
const TAGS = ['div', 'section', 'article', 'main', 'aside'] as const;
const WIDTHS = { narrow: '3', medium: '2' } as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Sidebar, { props, slot });
  const element = document.querySelector('.pp-sidebar');
  if (!element) throw new Error('racine .pp-sidebar absente');
  return element;
};

describe('Sidebar (rendu)', () => {
  it('rend un div avec les valeurs par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-side')).toBe('start');
    expect(element.getAttribute('data-space')).toBe('m');
    expect(element.getAttribute('data-side-width')).toBe('narrow');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    expect((await root({ space })).getAttribute('data-space')).toBe(space);
  });

  it.each(['start', 'end'])('reporte side="%s" dans data-side', async (side) => {
    expect((await root({ side })).getAttribute('data-side')).toBe(side);
  });

  it.each(Object.keys(WIDTHS))('reporte sideWidth="%s"', async (sideWidth) => {
    expect((await root({ sideWidth })).getAttribute('data-side-width')).toBe(sideWidth);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<aside>a</aside><div>b</div>');
    expect(element.children).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-sidebar', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-sidebar')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Sidebar, { props: { side: 'end' }, slot: '<p>x</p>' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Sidebar (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Sidebar.astro', import.meta.url), 'utf8');

  it.each(SPACES)('mappe data-space="%s" vers var(--pp-space-%s)', (space) => {
    const rule = new RegExp(
      `\\.pp-sidebar\\[data-space='${space}'\\]\\s*\\{\\s*--sidebar-space:\\s*var\\(--pp-space-${space}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it.each(Object.entries(WIDTHS))('mappe sideWidth="%s" vers measure / %s', (width, divisor) => {
    const rule = new RegExp(
      `\\[data-side-width='${width}'\\]\\s*\\{\\s*--sidebar-width:\\s*calc\\(var\\(--pp-size-measure\\) / ${divisor}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain("[data-side='start'] > :global(:first-child)");
    expect(source).toContain("[data-side='end'] > :global(:last-child)");
    expect(source).toContain('flex-grow: 999;');
    expect(source).toContain('min-inline-size: 50%;');
  });
});
