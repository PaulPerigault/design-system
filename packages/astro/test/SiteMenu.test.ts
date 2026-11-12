import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteMenu from '../src/navigation/SiteMenu.astro';
import { renderDom } from './render';

const ITEMS = [
  { label: 'Accueil', href: '/', current: true },
  { label: 'Contact', href: '/contact/' },
];
const PROPS = { label: 'Navigation principale', summary: 'Menu', items: ITEMS };

const render = (slot = '') => renderDom(SiteMenu, { props: PROPS, slot });

describe('SiteMenu (rendu)', () => {
  it('replie la navigation dans un details natif, fermé au chargement', async () => {
    const details = (await render()).querySelector('details');
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toBe('Menu');
    expect(details?.querySelector('nav')?.getAttribute('data-layout')).toBe('stack');
  });

  it('rend la même navigation en ligne, avec le même nom accessible', async () => {
    const navs = [...(await render()).querySelectorAll('nav')];
    expect(navs).toHaveLength(2);
    expect(navs.map((n) => n.getAttribute('aria-label'))).toEqual([
      'Navigation principale',
      'Navigation principale',
    ]);
    expect(navs[1]?.classList.contains('pp-site-menu__bar')).toBe(true);
  });

  it('marque la page courante dans les deux rendus', async () => {
    const current = (await render()).querySelectorAll('a[aria-current="page"]');
    expect(current).toHaveLength(2);
  });

  it('place le slot dans le panneau replié seulement', async () => {
    const document = await render('<a class="action" href="/rdv/">Rendez-vous</a>');
    expect(document.querySelectorAll('.pp-site-menu__panel .action')).toHaveLength(1);
    expect(document.querySelectorAll('.action')).toHaveLength(1);
  });

  it('zéro JavaScript, aucun attribut style', async () => {
    expect((await render()).querySelectorAll('script, [style]')).toHaveLength(0);
  });
});

describe('SiteMenu (source CSS)', () => {
  const css = readFileSync(new URL('../src/navigation/site-menu.css', import.meta.url), 'utf8');

  it('bascule par une requête de conteneur de 48 rem', () => {
    expect(css).toContain('container-type: inline-size');
    expect(css).toContain('@container (min-inline-size: 48rem)');
  });

  it('le bouton de repli est une cible d’un contrôle, sans valeur brute', () => {
    expect(css).toContain('min-block-size: var(--pp-size-control-height)');
    expect(css.replace('48rem', '')).not.toMatch(/\d(px|rem|em)\b/);
  });
});
