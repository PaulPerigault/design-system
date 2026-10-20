import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Stack from '../src/layout/Stack.astro';
import { renderDom } from './render';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;
const TAGS = ['div', 'section', 'ul', 'ol', 'article'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Stack, { props, slot });
  const element = document.querySelector('.pp-stack');
  if (!element) throw new Error('racine .pp-stack absente');
  return element;
};

describe('Stack (rendu)', () => {
  it('rend un div avec data-space="m" par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-space')).toBe('m');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    const element = await root({ space });
    expect(element.getAttribute('data-space')).toBe(space);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<p>un</p><p>deux</p>');
    expect(element.querySelectorAll('p')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-stack', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-stack')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Stack, { props: { space: 'xl' }, slot: '<p>x</p>' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Stack (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Stack.astro', import.meta.url), 'utf8');

  it.each(SPACES)('mappe data-space="%s" vers var(--pp-space-%s)', (space) => {
    const rule = new RegExp(
      `\\.pp-stack\\[data-space='${space}'\\]\\s*\\{\\s*--stack-space:\\s*var\\(--pp-space-${space}\\);`,
    );
    expect(source).toMatch(rule);
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-stack > :global(*)');
    expect(source).toContain('.pp-stack > :global(* + *)');
  });

  it('n’utilise aucune valeur de repli brute', () => {
    expect(source).not.toMatch(/var\(--pp-space-\w+\s*,/);
  });
});
