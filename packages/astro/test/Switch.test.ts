import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Switch from '../src/forms/Switch.astro';
import { renderDom } from './render';

const base = { id: 'alerts', name: 'alerts', label: 'Alertes par courriel' };

const input = async (props: Record<string, unknown> = {}): Promise<HTMLInputElement> => {
  const document = await renderDom(Switch, { props: { ...base, ...props } });
  const element = document.querySelector('input');
  if (!element) throw new Error('input absent');
  return element as HTMLInputElement;
};

describe('Switch (rendu)', () => {
  it('rend une case native avec le rôle switch', async () => {
    const element = await input();
    expect(element.getAttribute('type')).toBe('checkbox');
    expect(element.getAttribute('role')).toBe('switch');
    expect(element.id).toBe('alerts');
    expect(element.getAttribute('name')).toBe('alerts');
  });

  it('associe le libellé par for/id, sans texte en dur', async () => {
    const document = await renderDom(Switch, { props: base });
    const label = document.querySelector('label');
    expect(label?.getAttribute('for')).toBe('alerts');
    expect(label?.textContent?.trim()).toBe('Alertes par courriel');
    expect(document.body.textContent?.trim()).toBe('Alertes par courriel');
  });

  it('par défaut : décoché, actif, sans aria-describedby', async () => {
    const element = await input();
    expect(element.hasAttribute('checked')).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(element.hasAttribute('aria-describedby')).toBe(false);
  });

  it('reporte checked et disabled', async () => {
    const element = await input({ checked: true, disabled: true });
    expect(element.hasAttribute('checked')).toBe(true);
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  it('reporte describedBy dans aria-describedby', async () => {
    const element = await input({ describedBy: 'alerts-error' });
    expect(element.getAttribute('aria-describedby')).toBe('alerts-error');
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Switch, {
      props: { ...base, checked: true, disabled: true, describedBy: 'x' },
    });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Switch (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Switch.astro', import.meta.url), 'utf8');

  it('utilise appearance: none et les tokens de contrôle', () => {
    expect(source).toContain('appearance: none');
    expect(source).toContain('var(--pp-color-control)');
    expect(source).toContain('var(--pp-size-target-min)');
    expect(source).toContain('var(--pp-duration-fast)');
  });

  it('ne redéfinit pas le focus', () => {
    expect(source).not.toMatch(/:focus|outline/);
  });
});
