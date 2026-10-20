import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Cluster from '../src/layout/Cluster.astro';
import { renderDom } from './render';

const SPACES = ['xs', 's', 'm', 'l', 'xl'] as const;
const JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
} as const;
const ALIGN = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
} as const;
const TAGS = ['div', 'ul', 'ol', 'nav'] as const;

const root = async (props: Record<string, unknown> = {}, slot = ''): Promise<Element> => {
  const document = await renderDom(Cluster, { props, slot });
  const element = document.querySelector('.pp-cluster');
  if (!element) throw new Error('racine .pp-cluster absente');
  return element;
};

describe('Cluster (rendu)', () => {
  it('rend un div avec les attributs par défaut', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.getAttribute('data-space')).toBe('s');
    expect(element.getAttribute('data-justify')).toBe('start');
    expect(element.getAttribute('data-align')).toBe('center');
  });

  it.each(TAGS)('rend l’élément <%s> selon `as`', async (tag) => {
    const element = await root({ as: tag });
    expect(element.tagName.toLowerCase()).toBe(tag);
  });

  it.each(SPACES)('reporte space="%s" dans data-space', async (space) => {
    expect((await root({ space })).getAttribute('data-space')).toBe(space);
  });

  it.each(Object.keys(JUSTIFY))('reporte justify="%s" dans data-justify', async (justify) => {
    expect((await root({ justify })).getAttribute('data-justify')).toBe(justify);
  });

  it.each(Object.keys(ALIGN))('reporte align="%s" dans data-align', async (align) => {
    expect((await root({ align })).getAttribute('data-align')).toBe(align);
  });

  it.each(['ul', 'ol'])('pose role="list" sur <%s>', async (tag) => {
    expect((await root({ as: tag })).getAttribute('role')).toBe('list');
  });

  it.each(['div', 'nav'])('ne pose pas de role sur <%s>', async (tag) => {
    expect((await root({ as: tag })).hasAttribute('role')).toBe(false);
  });

  it('rend `label` en aria-label, et rien sans label', async () => {
    expect((await root({ as: 'nav', label: 'Réseaux' })).getAttribute('aria-label')).toBe(
      'Réseaux',
    );
    expect((await root({ as: 'nav' })).hasAttribute('aria-label')).toBe(false);
  });

  it('rend le slot', async () => {
    const element = await root({}, '<a href="#a">un</a><a href="#b">deux</a>');
    expect(element.querySelectorAll('a')).toHaveLength(2);
  });

  it('transmet `class` à côté de pp-cluster', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-cluster')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Cluster, { props: { space: 'xl' }, slot: '<p>x</p>' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Cluster (source CSS)', () => {
  const source = readFileSync(new URL('../src/layout/Cluster.astro', import.meta.url), 'utf8');
  const rule = (attr: string, value: string, property: string, target: string): RegExp =>
    new RegExp(
      `\\.pp-cluster\\[data-${attr}='${value}'\\]\\s*\\{\\s*--cluster-${property}:\\s*${target};`,
    );

  it.each(SPACES)('mappe data-space="%s" vers var(--pp-space-%s)', (space) => {
    expect(source).toMatch(rule('space', space, 'space', `var\\(--pp-space-${space}\\)`));
  });

  it.each(Object.entries(JUSTIFY))('mappe data-justify="%s" vers %s', (value, css) => {
    expect(source).toMatch(rule('justify', value, 'justify', css));
  });

  it.each(Object.entries(ALIGN))('mappe data-align="%s" vers %s', (value, css) => {
    expect(source).toMatch(rule('align', value, 'align', css));
  });

  it('vise les enfants du slot via :global(', () => {
    expect(source).toContain('.pp-cluster > :global(*)');
  });

  it('retire le style de liste sans propriété physique', () => {
    expect(source).toContain('list-style: none');
    expect(source).not.toMatch(/\b(?:margin|padding):\s*0/);
  });
});
