import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Input from '../src/forms/Input.astro';
import { renderDom } from './render';

const TYPES = ['text', 'email', 'url', 'tel', 'search', 'password', 'number'] as const;
const BASE = { id: 'nom', name: 'nom' };

const field = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(Input, { props: { ...BASE, ...props } });
  const element = document.querySelector('input');
  if (!element) throw new Error('input absent');
  return element;
};

describe('Input (rendu)', () => {
  it('rend un input text sans état par défaut', async () => {
    const element = await field();
    expect(element.getAttribute('type')).toBe('text');
    expect(element.getAttribute('id')).toBe('nom');
    expect(element.getAttribute('name')).toBe('nom');
    for (const attribute of ['required', 'disabled', 'aria-invalid', 'aria-describedby', 'value']) {
      expect(element.hasAttribute(attribute)).toBe(false);
    }
  });

  it.each(TYPES)('reporte type="%s"', async (type) => {
    expect((await field({ type })).getAttribute('type')).toBe(type);
  });

  it('expose le rôle textbox et le nom du <label for>', async () => {
    const markup = await renderDom(Input, { props: { ...BASE } });
    const label = markup.createElement('label');
    label.setAttribute('for', 'nom');
    label.textContent = 'Nom';
    markup.body.prepend(label);
    const control = markup.querySelector('input');
    const named = markup.querySelector(`label[for="${control?.id}"]`);
    expect(named?.textContent).toBe('Nom');
    expect(control?.getAttribute('type')).toBe('text');
  });

  it('pose aria-invalid="true" seulement si invalid', async () => {
    expect((await field({ invalid: true })).getAttribute('aria-invalid')).toBe('true');
    expect((await field({ invalid: false })).hasAttribute('aria-invalid')).toBe(false);
  });

  it('relie describedBy à aria-describedby', async () => {
    const element = await field({ describedBy: 'aide erreur' });
    expect(element.getAttribute('aria-describedby')).toBe('aide erreur');
  });

  it('reporte required, disabled et les attributs de saisie', async () => {
    const element = await field({
      required: true,
      disabled: true,
      value: 'Ada',
      autocomplete: 'name',
      inputmode: 'text',
      placeholder: 'Ada',
    });
    expect(element.hasAttribute('required')).toBe(true);
    expect(element.hasAttribute('disabled')).toBe(true);
    expect(element.getAttribute('value')).toBe('Ada');
    expect(element.getAttribute('autocomplete')).toBe('name');
    expect(element.getAttribute('inputmode')).toBe('text');
    expect(element.getAttribute('placeholder')).toBe('Ada');
  });

  it('transmet `class` à côté de pp-input', async () => {
    const element = await field({ class: 'placement' });
    expect(element.classList.contains('pp-input')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Input, { props: { ...BASE, invalid: true } });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Input (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Input.astro', import.meta.url), 'utf8');

  it('colore l’erreur via aria-invalid et :user-invalid', () => {
    expect(source).toContain(".pp-input[aria-invalid='true']");
    expect(source).toContain('.pp-input:user-invalid');
    expect(source).toContain('var(--pp-color-status-failed)');
  });

  it('utilise les tokens de contrôle', () => {
    expect(source).toContain('var(--pp-size-control-height)');
    expect(source).toContain('var(--pp-size-target-min)');
    expect(source).toContain('var(--pp-color-control)');
    expect(source).toContain('var(--pp-radius-control)');
  });

  it('ne redéfinit pas le focus', () => {
    expect(source).not.toMatch(/outline|:focus/);
  });
});
