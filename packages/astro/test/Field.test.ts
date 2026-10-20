import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Field from '../src/forms/Field.astro';
import { describedBy } from '../src/forms/field-ids';
import { renderDom } from './render';

const BASE = { id: 'email', label: 'Courriel' };
const INPUT = '<input id="email" type="email" />';

const render = async (props: Record<string, unknown> = {}, slot = INPUT): Promise<Document> =>
  renderDom(Field, { props: { ...BASE, ...props }, slot });

const root = (document: Document): Element => {
  const element = document.querySelector('.pp-field');
  if (!element) throw new Error('racine .pp-field absente');
  return element;
};

/** Texte lu par une technologie d'assistance : contenu hors `aria-hidden`, espaces normalisés. */
const spoken = (element: Element | null): string => {
  if (!element) return '';
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
};

describe('Field (rendu par défaut)', () => {
  it('relie le libellé au contrôle par for/id', async () => {
    const document = await render();
    const label = document.querySelector('label');
    expect(label?.getAttribute('for')).toBe('email');
    expect(document.getElementById('email')?.tagName.toLowerCase()).toBe('input');
    expect(spoken(label)).toBe('Courriel');
  });

  it('ne rend ni indication, ni erreur, ni mention obligatoire', async () => {
    const document = await render();
    expect(document.getElementById('email-hint')).toBeNull();
    expect(document.getElementById('email-error')).toBeNull();
    expect(document.querySelector('.pp-field__required')).toBeNull();
    expect(root(document).hasAttribute('data-invalid')).toBe(false);
  });

  it('place libellé, indication, erreur puis contrôle', async () => {
    const document = await render({ hint: 'h', error: 'e' });
    const tags = [...root(document).children].map((child) => child.tagName.toLowerCase());
    expect(tags).toEqual(['label', 'p', 'p', 'input']);
  });

  it('transmet `class` à côté de pp-field', async () => {
    const element = root(await render({ class: 'placement' }));
    expect(element.classList.contains('pp-field')).toBe(true);
    expect(element.classList.contains('placement')).toBe(true);
  });
});

describe('Field (props)', () => {
  it('ajoute au nom accessible le texte visible de requiredLabel', async () => {
    const document = await render({ required: true, requiredLabel: 'obligatoire' });
    expect(spoken(document.querySelector('label'))).toBe('Courriel obligatoire');
  });

  it('rend l’indication sous <id>-hint', async () => {
    const document = await render({ hint: 'Adresse professionnelle' });
    expect(spoken(document.getElementById('email-hint'))).toBe('Adresse professionnelle');
  });

  it('rend l’erreur sous <id>-error avec une icône décorative, sans aria-live', async () => {
    const document = await render({ error: 'Adresse invalide' });
    const error = document.getElementById('email-error');
    const icon = error?.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('focusable')).toBe('false');
    expect(error?.hasAttribute('aria-live')).toBe(false);
    expect(error?.hasAttribute('role')).toBe(false);
    expect(root(document).getAttribute('data-invalid')).toBe('true');
  });

  it.each([
    [undefined, 'Adresse invalide'],
    ['Erreur :', 'Erreur : Adresse invalide'],
  ])('préfixe l’erreur par errorLabel=%s', async (errorLabel, expected) => {
    const document = await render({ error: 'Adresse invalide', errorLabel });
    expect(spoken(document.getElementById('email-error'))).toBe(expected);
  });

  it('utilise les ids attendus par describedBy', async () => {
    const props = { ...BASE, hint: 'h', error: 'e' };
    const ids = describedBy(props) ?? '';
    const slot = `<input id="email" aria-describedby="${ids}" aria-invalid="true" />`;
    const document = await render(props, slot);
    const targets = ids.split(' ').map((id) => document.getElementById(id));
    expect(targets.every((target) => target?.tagName.toLowerCase() === 'p')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const props = { hint: 'h', error: 'e', errorLabel: 'Erreur :', required: true };
    const document = await render({ ...props, requiredLabel: 'obligatoire' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Field (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Field.astro', import.meta.url), 'utf8');
  const css = source.slice(source.indexOf('<style>'));

  it('vise le contenu du slot via :global(', () => {
    expect(css).toContain('.pp-field > :global(*)');
    expect(css).toContain('.pp-field:has(:global(:disabled))');
  });

  it('colore l’erreur par token, sans couleur brute, repli ni focus redéfini', () => {
    expect(css).toContain('color: var(--pp-color-status-failed);');
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(|rgb\(/i);
    expect(css).not.toMatch(/var\(--pp-[\w-]+\s*,/);
    expect(css).not.toMatch(/:focus/);
  });
});
