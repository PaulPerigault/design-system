import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Button from '../src/forms/Button.astro';
import { renderDom } from './render';

describe('Button (block)', () => {
  const render = (props: Record<string, unknown> = {}) =>
    renderDom(Button, { props, slot: 'Libellé' }).then((doc) => doc.querySelector('.pp-button'));

  it('ne pose aucune classe de pleine largeur par défaut ni pour block=false', async () => {
    expect((await render())?.classList.contains('pp-button--block')).toBe(false);
    expect((await render({ block: false }))?.classList.contains('pp-button--block')).toBe(false);
  });

  it('ajoute pp-button--block pour un bouton et pour un lien', async () => {
    expect((await render({ block: true }))?.classList.contains('pp-button--block')).toBe(true);
    const link = await render({ block: true, href: '/x' });
    expect(link?.tagName.toLowerCase()).toBe('a');
    expect(link?.classList.contains('pp-button--block')).toBe(true);
  });
});

describe('Button (source CSS : block et bord)', () => {
  const css = readFileSync(new URL('../src/forms/button.css', import.meta.url), 'utf8');

  it('block : pleine largeur, libellé centré, sans valeur brute', () => {
    expect(css).toMatch(/\.pp-button--block\s*\{[^}]*inline-size: 100%;[^}]*text-align: center/);
  });

  it('--pp-button-border-color : repli sur le bord actuel de chaque ton', () => {
    expect(css).toContain('solid var(--pp-button-border-color, transparent)');
    expect(css).toContain('border-color: var(--pp-button-border-color, var(--pp-color-control))');
    expect(css).toContain('border-color: var(--pp-button-border-color, var(--pp-color-fg))');
  });

  it('le fond du ton principal est l’aplat d’accent, pas le texte d’accent', () => {
    expect(css).toMatch(/\.pp-button--primary\s*\{\s*background-color: var\(--pp-color-accent\);/);
  });
});
