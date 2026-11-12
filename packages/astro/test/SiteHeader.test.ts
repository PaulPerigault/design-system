import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../src/navigation/SiteFooter.astro';
import SiteHeader from '../src/navigation/SiteHeader.astro';
import { renderDom } from './render';

const read = (file: string) =>
  readFileSync(new URL(`../src/navigation/${file}`, import.meta.url), 'utf8');

const withSlots = (slots: Record<string, string>, props = {}): Promise<Document> =>
  renderDom(SiteHeader, { slots, props });

describe('SiteHeader (rendu)', () => {
  it('rend un header avec les trois slots, dans l’ordre signature, navigation, action', async () => {
    const document = await withSlots({ action: 'A', signature: 'S', navigation: 'N' });
    expect(document.querySelectorAll('header')).toHaveLength(1);
    const zones = [...document.querySelectorAll('.pp-site-header__bar > div')];
    expect(zones.map((zone) => zone.className)).toEqual([
      'pp-site-header__signature',
      'pp-site-header__navigation',
      'pp-site-header__action',
    ]);
  });

  it('un slot vide ne rend aucun élément', async () => {
    const document = await withSlots({ signature: 'S' });
    expect(document.querySelectorAll('.pp-site-header__bar > div')).toHaveLength(1);
    expect(document.querySelector('.pp-site-header__action')).toBeNull();
  });

  it('zéro script, aucun attribut style', async () => {
    const document = await withSlots({ signature: 'S', navigation: 'N', action: 'A' });
    expect(document.querySelectorAll('script, [style]')).toHaveLength(0);
  });
});

describe('SiteHeader (source CSS)', () => {
  const css = read('site-header.css');

  it('une rangée dès 48 rem de conteneur, l’action masquée en dessous', () => {
    expect(css).toContain('@container (min-inline-size: 48rem)');
    expect(css).toMatch(/__action\s*\{\s*display: none;/);
  });

  it('cible de la hauteur d’un contrôle, sans valeur brute hors le seuil', () => {
    expect(css).toContain('min-block-size: var(--pp-size-control-height)');
    expect(css.replace('48rem', '')).not.toMatch(/\d(px|rem|em)\b/);
  });
});

describe('SiteFooter (rendu)', () => {
  const render = (slots: Record<string, string>) => renderDom(SiteFooter, { slots });

  it('rend un footer, une colonne par slot rempli, dans l’ordre', async () => {
    const document = await render({ links: 'L', identity: 'I', contact: 'C' });
    expect(document.querySelectorAll('footer')).toHaveLength(1);
    const columns = [...document.querySelectorAll('.pp-site-footer__column')];
    expect(columns.map((column) => column.getAttribute('data-slot'))).toEqual([
      'identity',
      'contact',
      'links',
    ]);
  });

  it('un slot vide ne laisse aucune colonne', async () => {
    const document = await render({ identity: 'I', links: 'L' });
    expect(document.querySelectorAll('.pp-site-footer__column')).toHaveLength(2);
    expect(document.querySelector('[data-slot="contact"]')).toBeNull();
  });

  it('zéro script, aucun attribut style', async () => {
    expect((await render({ identity: 'I' })).querySelectorAll('script, [style]')).toHaveLength(0);
  });
});

describe('SiteFooter (source CSS)', () => {
  const css = read('site-footer.css');

  it('une colonne par défaut, des colonnes égales dès 48 rem de conteneur', () => {
    expect(css).toContain('@container (min-inline-size: 48rem)');
    expect(css).toMatch(/grid-auto-flow: column;\s*grid-auto-columns: 1fr;/);
    expect(css.replace('48rem', '')).not.toMatch(/\d(px|rem|em)\b/);
  });
});
