import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Switcher from '../src/layout/Switcher.astro';
import { renderDom } from './render';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;
const THRESHOLDS = { measure: '--pp-size-measure', page: '--pp-size-page' } as const;
const TAGS = ['div', 'section', 'ul', 'ol', 'article'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Switcher, { props, slot });
  const element = document.querySelector('.pp-switcher');
  if (!element) throw new Error('racine .pp-switcher absente');
  return element;
};

describe('Switcher (rendu)', () => {
  it('rend un div avec threshold="measure" et space="m" par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-threshold')).toBe('measure');
    expect(element.getAttribute('data-space')).toBe('m');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(Object.keys(THRESHOLDS))('reporte threshold="%s" dans data-threshold', async (value) => {
    const element = await root({ threshold: value });
    expect(element.getAttribute('data-threshold')).toBe(value);
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    const element = await root({ space });
    expect(element.getAttribute('data-space')).toBe(space);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<p>un</p><p>deux</p>');
    expect(element.querySelectorAll('p')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-switcher', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-switcher')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Switcher, {
      props: { threshold: 'page', space: 'xl' },
      slot: '<p>x</p>',
    });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Switcher (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Switcher.astro', import.meta.url), 'utf8');

  it.each(Object.entries(THRESHOLDS))('mappe data-threshold="%s" vers var(%s)', (value, token) => {
    const rule = new RegExp(
      `\\.pp-switcher\\[data-threshold='${value}'\\]\\s*\\{\\s*--switcher-threshold:\\s*var\\(${token}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it.each(SPACES)('mappe data-space="%s" vers var(--pp-space-%s)', (space) => {
    const rule = new RegExp(
      `\\.pp-switcher\\[data-space='${space}'\\]\\s*\\{\\s*--switcher-space:\\s*var\\(--pp-space-${space}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('vise les enfants du slot via :global( avec la technique Holy Albatross', () => {
    expect(source).toContain('.pp-switcher > :global(*)');
    expect(source).toContain('flex-basis: calc((var(--switcher-threshold) - 100%) * 999)');
    expect(source).toContain('flex-grow: 1');
  });
});
