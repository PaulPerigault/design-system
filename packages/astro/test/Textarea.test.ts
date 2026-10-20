import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Textarea from '../src/forms/Textarea.astro';
import { renderDom } from './render';

const base = { id: 'message', name: 'message' };

const field = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(Textarea, { props: { ...base, ...props } });
  const element = document.querySelector('textarea');
  if (!element) throw new Error('textarea absent');
  return element;
};

describe('Textarea (rendu)', () => {
  it('rend un textarea natif (rôle textbox multiligne) relié à son label par id', async () => {
    const element = await field();
    expect(element.tagName.toLowerCase()).toBe('textarea');
    expect(element.getAttribute('id')).toBe('message');
    expect(element.getAttribute('name')).toBe('message');
  });

  it('applique les valeurs par défaut', async () => {
    const element = await field();
    expect(element.getAttribute('rows')).toBe('4');
    expect(element.textContent).toBe('');
    expect(element.hasAttribute('required')).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(element.hasAttribute('aria-invalid')).toBe(false);
    expect(element.hasAttribute('aria-describedby')).toBe(false);
  });

  it('reporte rows et value', async () => {
    const element = await field({ rows: 8, value: 'Bonjour\nle monde' });
    expect(element.getAttribute('rows')).toBe('8');
    expect(element.textContent).toBe('Bonjour\nle monde');
  });

  it('échappe la valeur', async () => {
    const element = await field({ value: '</textarea><script>x</script>' });
    expect(element.ownerDocument.querySelectorAll('script')).toHaveLength(0);
  });

  it('pose required et disabled natifs', async () => {
    const element = await field({ required: true, disabled: true });
    expect(element.hasAttribute('required')).toBe(true);
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  it('pose aria-invalid="true" seulement si invalid', async () => {
    expect((await field({ invalid: true })).getAttribute('aria-invalid')).toBe('true');
    expect((await field({ invalid: false })).hasAttribute('aria-invalid')).toBe(false);
  });

  it('relie l’aide ou l’erreur par aria-describedby', async () => {
    const element = await field({ describedBy: 'aide erreur' });
    expect(element.getAttribute('aria-describedby')).toBe('aide erreur');
  });

  it('transmet `class` à côté de pp-textarea', async () => {
    const element = await field({ class: 'placement' });
    expect(element.classList.contains('pp-textarea')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const element = await field({ invalid: true, disabled: true, value: 'x' });
    expect(element.ownerDocument.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Textarea (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Textarea.astro', import.meta.url), 'utf8');

  it('redimensionne verticalement seulement', () => {
    expect(source).toMatch(/resize:\s*block;/);
  });

  it('active field-sizing en amélioration progressive', () => {
    expect(source).toMatch(/@supports \(field-sizing: content\)[\s\S]*field-sizing:\s*content;/);
  });

  it('utilise les tokens de contrôle et ne redéfinit pas le focus', () => {
    expect(source).toContain('var(--pp-color-control)');
    expect(source).toContain('var(--pp-radius-control)');
    expect(source).toContain('var(--pp-size-control-height)');
    expect(source).not.toMatch(/:focus|outline/);
  });
});
