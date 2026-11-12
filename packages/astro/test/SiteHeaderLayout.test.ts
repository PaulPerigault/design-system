import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../src/navigation/SiteHeader.astro';
import { DEFAULT_EXPAND_AT, expandAtOf } from '../src/navigation/site-expand';
import { renderDom } from './render';

const read = (file: string) =>
  readFileSync(new URL(`../src/navigation/${file}`, import.meta.url), 'utf8');

const withSlots = (slots: Record<string, string>, props = {}): Promise<Document> =>
  renderDom(SiteHeader, { slots, props });

describe('SiteHeader (layout et seuil)', () => {
  const header = async (props: Record<string, unknown>) =>
    (await withSlots({ signature: 'S' }, props)).querySelector('header');

  it('stacked et 48 rem par défaut', async () => {
    const element = await header({});
    expect(element?.getAttribute('data-layout')).toBe('stacked');
    expect(element?.getAttribute('data-expand-at')).toBe('48');
  });

  it('layout inline et expandAt de la liste fermée', async () => {
    const element = await header({ layout: 'inline', expandAt: 64 });
    expect(element?.getAttribute('data-layout')).toBe('inline');
    expect(element?.getAttribute('data-expand-at')).toBe('64');
  });

  it('une valeur hors liste retombe sur le défaut', () => {
    expect(expandAtOf(50)).toBe(DEFAULT_EXPAND_AT);
    expect(expandAtOf(undefined)).toBe(DEFAULT_EXPAND_AT);
    expect(expandAtOf(75)).toBe(75);
  });
});

describe('SiteHeader (source CSS, layout et seuil)', () => {
  const css = read('site-header.css');
  const expand = read('site-expand.css');

  it('le seuil de l’action suit expandAt, par le conteneur nommé', () => {
    expect(css).toContain('container: pp-site-bar / inline-size');
    for (const seuil of [48, 56, 64, 75]) {
      expect(expand).toContain(
        `.pp-site-header[data-expand-at='${seuil}'] .pp-site-header__action {`,
      );
    }
  });

  it('marges par jetons de marque, repli sur les espacements actuels', () => {
    expect(css).toContain(
      'padding-block: var(--pp-site-header-padding-block, var(--pp-space-3xs))',
    );
    expect(css).toContain(
      'padding-inline: var(--pp-site-header-padding-inline, var(--pp-space-s))',
    );
  });

  it('inline : une rangée, bouton à droite, panneau sous l’en-tête', () => {
    expect(css).toMatch(/\[data-layout='inline'\] \.pp-site-header__bar \{\s*flex-wrap: nowrap;/);
    expect(css).toContain('margin-inline-start: auto');
    expect(css).toMatch(/\[data-layout='inline'\] \{\s*position: relative;/);
    expect(css).toContain('position: absolute');
  });
});
