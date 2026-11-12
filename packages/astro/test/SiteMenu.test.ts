import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteMenu from '../src/navigation/SiteMenu.astro';
import { renderDom } from './render';

const ITEMS = [
  { label: 'Accueil', href: '/', current: true },
  { label: 'Contact', href: '/contact/' },
];
const PROPS = { label: 'Navigation principale', summary: 'Menu', items: ITEMS };

const render = (slot = '', props: Record<string, unknown> = {}) =>
  renderDom(SiteMenu, { props: { ...PROPS, ...props }, slot });

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

describe('SiteMenu (barItems et expandAt)', () => {
  const BAR = [{ label: 'Accueil', href: '/' }];
  const labels = (nav: Element | null | undefined) =>
    [...(nav?.querySelectorAll('a') ?? [])].map((link) => link.textContent?.trim());

  it('sans barItems, la barre reprend items', async () => {
    const document = await render();
    expect(labels(document.querySelector('.pp-site-menu__bar'))).toEqual(['Accueil', 'Contact']);
  });

  it('avec barItems, la barre a sa liste et le repli garde items', async () => {
    const document = await render('', { barItems: BAR });
    expect(labels(document.querySelector('.pp-site-menu__bar'))).toEqual(['Accueil']);
    expect(labels(document.querySelector('details'))).toEqual(['Accueil', 'Contact']);
  });

  it('expandAt : 48 par défaut, valeur de la liste sinon', async () => {
    const seuil = async (props: Record<string, unknown>) =>
      (await render('', props)).querySelector('.pp-site-menu')?.getAttribute('data-expand-at');
    expect(await seuil({})).toBe('48');
    expect(await seuil({ expandAt: 75 })).toBe('75');
    expect(await seuil({ expandAt: 50 })).toBe('48');
  });
});

describe('SiteMenu (source CSS)', () => {
  const read = (file: string) =>
    readFileSync(new URL(`../src/navigation/${file}`, import.meta.url), 'utf8');
  const css = read('site-menu.css');
  const expand = read('site-expand.css');

  it('seul, le menu est un conteneur nommé ; dans un en-tête, il n’en est pas un', () => {
    expect(css).toContain('.pp-site-menu:not(.pp-site-header *)');
    expect(css).toContain('container: pp-site-bar / inline-size');
  });

  it('une requête de conteneur nommée par valeur de la liste fermée', () => {
    for (const seuil of [48, 56, 64, 75]) {
      expect(expand).toContain(`@container pp-site-bar (min-inline-size: ${seuil}rem)`);
      expect(expand).toContain(`[data-expand-at='${seuil}']`);
    }
    expect(expand.match(/@container/g)).toHaveLength(4);
  });

  it('le bouton de repli est une cible d’un contrôle, sans valeur brute', () => {
    expect(css).toContain('min-block-size: var(--pp-size-control-height)');
    expect(css.replace('48rem', '')).not.toMatch(/\d(px|rem|em)\b/);
  });
});
