import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Choice from '../src/forms/Choice.astro';
import { renderDom } from './render';

const base = { id: 'news', name: 'topics', value: 'news', label: 'Recevoir les nouvelles' };

const input = async (props: Record<string, unknown> = {}): Promise<HTMLInputElement> => {
  const document = await renderDom(Choice, { props: { type: 'checkbox', ...base, ...props } });
  const element = document.querySelector('input');
  if (!element) throw new Error('input absent');
  return element as HTMLInputElement;
};

describe('Choice (rendu)', () => {
  it.each([
    ['checkbox', 'checkbox'],
    ['radio', 'radio'],
  ])('type="%s" rend un input de rôle %s', async (type) => {
    const element = await input({ type });
    expect(element.getAttribute('type')).toBe(type);
  });

  it('relie le label à l’input par for/id (nom accessible)', async () => {
    const document = await renderDom(Choice, { props: { type: 'radio', ...base } });
    const label = document.querySelector('label');
    expect(label?.getAttribute('for')).toBe('news');
    expect(label?.textContent?.trim()).toBe(base.label);
    expect(document.querySelector('input')?.getAttribute('id')).toBe('news');
  });

  it('place le label après l’input', async () => {
    const document = await renderDom(Choice, { props: { type: 'checkbox', ...base } });
    expect(document.querySelector('input + label')).not.toBeNull();
  });

  it('transmet name et value', async () => {
    const element = await input();
    expect(element.getAttribute('name')).toBe('topics');
    expect(element.getAttribute('value')).toBe('news');
  });

  it('n’est ni cochée, ni désactivée, ni décrite par défaut', async () => {
    const element = await input();
    expect(element.hasAttribute('checked')).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(element.hasAttribute('aria-describedby')).toBe(false);
  });

  it('applique checked et disabled', async () => {
    const element = await input({ checked: true, disabled: true });
    expect(element.hasAttribute('checked')).toBe(true);
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  it('reporte describedBy dans aria-describedby', async () => {
    const element = await input({ describedBy: 'news-error' });
    expect(element.getAttribute('aria-describedby')).toBe('news-error');
  });

  it('marque la racine data-disabled seulement si désactivée', async () => {
    const off = await renderDom(Choice, { props: { type: 'radio', ...base } });
    const on = await renderDom(Choice, { props: { type: 'radio', ...base, disabled: true } });
    expect(off.querySelector('.pp-choice')?.hasAttribute('data-disabled')).toBe(false);
    expect(on.querySelector('.pp-choice')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await renderDom(Choice, {
      props: { type: 'checkbox', ...base, checked: true, disabled: true, describedBy: 'x' },
    });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Choice (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Choice.astro', import.meta.url), 'utf8');

  it('colore la case avec le token d’accent', () => {
    expect(source).toContain('accent-color: var(--pp-color-accent);');
  });

  it('garantit une cible minimale par les tokens', () => {
    expect(source).toContain('var(--pp-size-target-min)');
    expect(source).toContain('min-block-size: var(--pp-size-control-height)');
  });

  it('ne redéfinit pas le focus', () => {
    expect(source).not.toMatch(/:focus|outline/);
  });
});
