import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Button from '../src/forms/Button.astro';
import { renderDom } from './render';

const LABEL = 'Envoyer';
const TONES = ['primary', 'secondary', 'quiet'] as const;

const root = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(Button, { props, slot: LABEL });
  const element = document.querySelector('.pp-button');
  if (!element) throw new Error('racine .pp-button absente');
  return element;
};

describe('Button (rendu)', () => {
  it('rend un <button type="button"> primary m par défaut, nommé par le slot', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('button');
    expect(element.getAttribute('type')).toBe('button');
    expect(element.textContent?.trim()).toBe(LABEL);
    expect(element.classList.contains('pp-button--primary')).toBe(true);
    expect(element.classList.contains('pp-button--m')).toBe(true);
    expect(element.hasAttribute('disabled')).toBe(false);
  });

  it.each(TONES)('applique la classe de tone="%s"', async (tone) => {
    const element = await root({ tone });
    expect(element.classList.contains(`pp-button--${tone}`)).toBe(true);
  });

  it('applique size="l"', async () => {
    const element = await root({ size: 'l' });
    expect(element.classList.contains('pp-button--l')).toBe(true);
  });

  it('transmet type="submit"', async () => {
    const element = await root({ type: 'submit' });
    expect(element.getAttribute('type')).toBe('submit');
  });

  it('désactive le bouton natif sans aria-disabled', async () => {
    const element = await root({ disabled: true });
    expect(element.hasAttribute('disabled')).toBe(true);
    expect(element.hasAttribute('aria-disabled')).toBe(false);
  });

  it('rend un lien nommé quand href est fourni', async () => {
    const element = await root({ href: '/contact/' });
    expect(element.tagName.toLowerCase()).toBe('a');
    expect(element.getAttribute('href')).toBe('/contact/');
    expect(element.hasAttribute('type')).toBe(false);
    expect(element.hasAttribute('aria-disabled')).toBe(false);
    expect(element.textContent?.trim()).toBe(LABEL);
  });

  it('désactive un lien : pas de href, role link, aria-disabled', async () => {
    const element = await root({ href: '/contact/', disabled: true });
    expect(element.tagName.toLowerCase()).toBe('a');
    expect(element.hasAttribute('href')).toBe(false);
    expect(element.getAttribute('role')).toBe('link');
    expect(element.getAttribute('aria-disabled')).toBe('true');
  });

  it('transmet `class` à côté de pp-button', async () => {
    const element = await root({ class: 'placement' });
    expect(element.classList.contains('pp-button')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Button, { props: { href: '/', tone: 'quiet' }, slot: LABEL });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Button (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Button.astro', import.meta.url), 'utf8');

  it('utilise les tokens de contrôle', () => {
    expect(source).toContain('min-block-size: var(--pp-size-control-height)');
    expect(source).toContain('min-inline-size: var(--pp-size-target-min)');
    expect(source).toContain('var(--pp-color-control)');
    expect(source).toContain('var(--pp-radius-control)');
  });

  it('limite les transitions à --pp-duration-fast', () => {
    expect(source).toContain('var(--pp-duration-fast)');
    expect(source).not.toContain('var(--pp-duration-base)');
  });

  it('ne redéfinit pas le focus', () => {
    expect(source).not.toMatch(/outline|:focus/);
  });
});
