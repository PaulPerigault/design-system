import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteNav from '../src/navigation/SiteNav.astro';
import { renderDom } from './render';

const ITEMS = [
  { label: 'Accueil', href: '/' },
  { label: 'Tarifs', href: '/tarifs/', current: true },
  { label: 'Contact', href: '/contact/' },
];
const BASE = { label: 'Navigation principale', items: ITEMS };

const nav = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await renderDom(SiteNav, { props: { ...BASE, ...props } })).querySelector('nav');
  if (!element) throw new Error('nav absent');
  return element;
};

describe('SiteNav (rendu)', () => {
  it('rend un repère nommé et une liste au rôle explicite', async () => {
    const element = await nav();
    expect(element.getAttribute('aria-label')).toBe('Navigation principale');
    expect(element.querySelector('ul')?.getAttribute('role')).toBe('list');
    expect(element.querySelectorAll('li > a')).toHaveLength(3);
  });

  it('pose aria-current="page" sur la seule page courante', async () => {
    const links = [...(await nav()).querySelectorAll('a')];
    expect(links.map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page', null]);
  });

  it('garde les liens dans l’ordre donné', async () => {
    const hrefs = [...(await nav()).querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/tarifs/', '/contact/']);
  });

  it('data-layout vaut row par défaut et stack sur demande', async () => {
    expect((await nav()).getAttribute('data-layout')).toBe('row');
    expect((await nav({ layout: 'stack' })).getAttribute('data-layout')).toBe('stack');
  });

  it('transmet `class`, sans script ni attribut style', async () => {
    const document = await renderDom(SiteNav, { props: { ...BASE, class: 'placement' } });
    expect(document.querySelector('nav')?.classList.contains('placement')).toBe(true);
    expect(document.querySelectorAll('script, [style]')).toHaveLength(0);
  });
});

describe('SiteNav (source CSS)', () => {
  const css = readFileSync(new URL('../src/navigation/site-nav.css', import.meta.url), 'utf8');

  it('cibles de la hauteur d’un contrôle, sans valeur brute de longueur', () => {
    expect(css).toContain('min-block-size: var(--pp-size-control-height)');
    expect(css).not.toMatch(/\d(px|rem|em)\b/);
  });

  it('la page courante : soulignement épais et graisse, pas la couleur seule', () => {
    expect(css).toMatch(
      /a\[aria-current='page'\]\s*\{[^}]*font-weight: var\(--pp-site-nav-current-weight, var\(--pp-font-weight-bold\)\)/,
    );
    expect(css).toContain('text-decoration-thickness: var(--pp-size-focus-width)');
  });

  it('habillage par propriétés personnalisées, repli sur les valeurs d’origine', () => {
    expect(css).toContain('gap: var(--pp-site-nav-gap, var(--pp-space-3xs) var(--pp-space-s))');
    expect(css).toContain('color: var(--pp-site-nav-color, var(--pp-color-fg))');
    expect(css).toContain(
      'color: var(--pp-site-nav-current-color, var(--pp-site-nav-color, var(--pp-color-fg)))',
    );
    expect(css).toContain(
      'font-weight: var(--pp-site-nav-current-weight, var(--pp-font-weight-bold))',
    );
    expect(css).toContain(
      'text-underline-offset: var(--pp-site-nav-underline-offset, var(--pp-size-focus-offset))',
    );
  });

  it('ne redéfinit pas le focus', () => {
    expect(css).not.toMatch(/outline|:focus/);
  });
});
