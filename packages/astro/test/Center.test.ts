import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Center from '../src/layout/Center.astro';
import { renderDom } from './render';

const TAGS = ['div', 'section', 'article', 'main', 'header', 'footer'] as const;
const GUTTERS = ['s', 'm'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Center, { props, slot });
  const element = document.querySelector('.pp-center');
  if (!element) throw new Error('racine .pp-center absente');
  return element;
};

describe('Center (rendu)', () => {
  it('rend un div sans data-* par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.hasAttribute('data-text')).toBe(false);
    expect(element.hasAttribute('data-intrinsic')).toBe(false);
    expect(element.hasAttribute('data-gutter')).toBe(false);
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it('pose data-text avec text', async () => {
    const element = await root({ text: true });
    expect(element.hasAttribute('data-text')).toBe(true);
  });

  it('pose data-intrinsic avec intrinsic', async () => {
    const element = await root({ intrinsic: true });
    expect(element.hasAttribute('data-intrinsic')).toBe(true);
  });

  it.each(GUTTERS)('reporte gutter="%s" dans data-gutter', async (gutter) => {
    const element = await root({ gutter });
    expect(element.getAttribute('data-gutter')).toBe(gutter);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<p>un</p><p>deux</p>');
    expect(element.querySelectorAll('p')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-center', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-center')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const props = { text: true, intrinsic: true, gutter: 'm' };
    const document = await renderDom(Center, { props, slot: '<p>x</p>' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Center (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Center.astro', import.meta.url), 'utf8');

  it('centre à la largeur de lecture', () => {
    expect(source).toMatch(/box-sizing:\s*content-box;/);
    expect(source).toMatch(/margin-inline:\s*auto;/);
    expect(source).toMatch(/max-inline-size:\s*var\(--pp-size-measure\);/);
  });

  it('mappe data-text vers text-align: center', () => {
    expect(source).toMatch(/\.pp-center\[data-text\]\s*\{\s*text-align:\s*center;/);
  });

  it('mappe data-intrinsic vers une colonne flex centrée', () => {
    const rule =
      /\.pp-center\[data-intrinsic\]\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*align-items:\s*center;/;
    expect(source).toMatch(rule);
  });

  it.each(GUTTERS)('mappe data-gutter="%s" vers var(--pp-space-%s)', (gutter) => {
    const rule = new RegExp(
      `\\.pp-center\\[data-gutter='${gutter}'\\]\\s*\\{\\s*padding-inline:\\s*var\\(--pp-space-${gutter}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-center > :global(*)');
  });
});
