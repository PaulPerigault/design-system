import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../src/navigation/SiteFooter.astro';
import { renderDom } from './render';

const read = (file: string) =>
  readFileSync(new URL(`../src/navigation/${file}`, import.meta.url), 'utf8');

const render = (slots: Record<string, string>) => renderDom(SiteFooter, { slots });

describe('SiteFooter (slot legal)', () => {
  it('rend la zone sous les colonnes, dans le même footer', async () => {
    const document = await render({ identity: 'I', links: 'L', legal: 'Mentions' });
    const footer = document.querySelector('footer');
    const children = [...(footer?.children ?? [])].map((child) => child.className);
    expect(document.querySelectorAll('footer')).toHaveLength(1);
    expect(children).toEqual(['pp-site-footer__columns', 'pp-site-footer__legal']);
    expect(footer?.querySelector('.pp-site-footer__legal')?.textContent?.trim()).toBe('Mentions');
  });

  it('slot vide : aucun élément rendu, colonnes inchangées', async () => {
    const document = await render({ identity: 'I', contact: 'C', links: 'L' });
    expect(document.querySelector('.pp-site-footer__legal')).toBeNull();
    expect(document.querySelectorAll('.pp-site-footer__column')).toHaveLength(3);
  });

  it('la zone n’est pas une colonne', async () => {
    const document = await render({ identity: 'I', legal: 'M' });
    expect(document.querySelectorAll('.pp-site-footer__column')).toHaveLength(1);
    expect(document.querySelectorAll('script, [style]')).toHaveLength(0);
  });
});

describe('SiteFooter (jetons de marges)', () => {
  const css = read('site-footer.css');

  it('colonnes et zone légale lisent les jetons, repli sur les espacements actuels', () => {
    const block = 'var(--pp-site-footer-padding-block, var(--pp-space-m))';
    const inline = 'var(--pp-site-footer-padding-inline, var(--pp-space-s))';
    expect(css).toContain(`padding-block: ${block}`);
    expect(css).toContain(`padding-block-end: ${block}`);
    expect(css.split(`padding-inline: ${inline}`)).toHaveLength(3);
  });

  it('la zone légale reste hors de la grille des colonnes', () => {
    expect(css).not.toMatch(/__legal[^{]*\{[^}]*grid/);
    expect(css.replace('48rem', '')).not.toMatch(/\d(px|rem|em)\b/);
  });
});
