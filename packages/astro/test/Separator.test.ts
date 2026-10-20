import { describe, expect, it } from 'vitest';
import Separator from '../src/content/Separator.astro';
import { renderDom } from './render';
import { readFileSync } from 'node:fs';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<HTMLHRElement> => {
  const document = await renderDom(Separator, { props, slot });
  const element = document.querySelector('hr');
  if (!element) throw new Error('élément <hr> absent');
  return element;
};

describe('Separator (rendu)', () => {
  it('rend un <hr> natif sans prop, sans rôle, pas aria-hidden', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('hr');
    expect(element.hasAttribute('role')).toBe(false);
    expect(element.hasAttribute('aria-hidden')).toBe(false);
    expect(element.getAttribute('data-space')).toBe('m');
  });

  it('rend decorative={true} avec role="presentation" et aria-hidden="true"', async () => {
    const element = await root({ decorative: true });
    expect(element.getAttribute('role')).toBe('presentation');
    expect(element.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    expect((await root({ space })).getAttribute('data-space')).toBe(space);
  });

  it('rend le slot vide par défaut', async () => {
    const element = await root();
    expect(element.childNodes.length).toBe(0);
  });

  it('transmet `class` à côté de pp-separator', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-separator')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Separator, { props: { space: 'xl' } });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Separator (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Separator.astro', import.meta.url), 'utf8');

  it('utilise les tokens de règle et de ligne', () => {
    expect(source).toContain('block-size: var(--pp-size-rule)');
    expect(source).toContain('background-color: var(--pp-color-line)');
  });

  it('ne pose pas de border sur <hr>', () => {
    expect(source).toContain('border: 0');
  });

  it('mappe data-space vers var(--pp-space-*)', () => {
    const rule = (value: string, target: string): RegExp =>
      new RegExp(
        `\\.pp-separator\\[data-space='${value}'\\]\\s*\\{\\s*--separator-space:\\s*${target};`,
      );
    expect(source).toMatch(rule('xs', 'var\\(--pp-space-xs\\)'));
    expect(source).toMatch(rule('s', 'var\\(--pp-space-s\\)'));
    expect(source).toMatch(rule('m', 'var\\(--pp-space-m\\)'));
    expect(source).toMatch(rule('l', 'var\\(--pp-space-l\\)'));
    expect(source).toMatch(rule('xl', 'var\\(--pp-space-xl\\)'));
  });
});
