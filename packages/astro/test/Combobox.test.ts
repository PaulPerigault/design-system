import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Combobox from '../src/forms/Combobox.astro';
import { renderDom } from './render';

const OPTIONS = [
  { value: 'fr', label: 'France' },
  { value: 'ee', label: 'Estonie' },
];
const LABELS = { noResultsLabel: 'Aucun pays', countLabel: '{count} pays' };
const BASE = { label: 'Pays', name: 'pays', id: 'pays', options: OPTIONS, ...LABELS };

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Combobox, { props: { ...BASE, ...props } });

const control = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const input = (await render(props)).querySelector('input');
  if (!input) throw new Error('input absent');
  return input;
};

describe('Combobox (rendu)', () => {
  it('rend un combobox ARIA relié à sa liste, avec les défauts', async () => {
    const input = await control();
    const names = ['role', 'aria-expanded', 'aria-controls', 'aria-autocomplete', 'autocomplete'];
    const got = names.map((name) => input.getAttribute(name));
    expect(got).toEqual(['combobox', 'false', 'pays-listbox', 'list', 'off']);
    expect(input.getAttribute('name')).toBe('pays');
    const absent = ['required', 'aria-invalid', 'aria-describedby', 'aria-activedescendant'];
    expect([...absent, 'value'].filter((name) => input.hasAttribute(name))).toEqual([]);
  });

  it('garde un datalist natif pour le rendu sans script', async () => {
    const document = await render();
    const input = document.querySelector('input');
    const datalist = document.getElementById(input?.getAttribute('list') ?? '');
    expect(datalist?.tagName.toLowerCase()).toBe('datalist');
    const values = [...(datalist?.querySelectorAll('option') ?? [])].map((o) => o.value);
    expect(values).toEqual(['France', 'Estonie']);
  });

  it('nomme le champ par <label for> et la liste par aria-label', async () => {
    const document = await render();
    expect(document.querySelector('label[for="pays"]')?.textContent?.trim()).toBe('Pays');
    const list = document.querySelector('[role="listbox"]');
    const seen = [list?.id, list?.getAttribute('aria-label'), list?.hasAttribute('hidden')];
    expect(seen).toEqual(['pays-listbox', 'Pays', true]);
  });

  it('rend des options aux id stables, non sélectionnées', async () => {
    const options = [...(await render()).querySelectorAll('[role="option"]')];
    expect(options.map((o) => o.id)).toEqual(['pays-option-0', 'pays-option-1']);
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false']);
    expect(options.map((o) => o.getAttribute('data-value'))).toEqual(['fr', 'ee']);
    expect(options[0]?.textContent?.trim()).toBe('France');
  });

  it('porte une zone role="status" vide et les libellés pour le script', async () => {
    const document = await render();
    expect(document.querySelector('[role="status"]')?.textContent).toBe('');
    const root = document.querySelector('[data-pp-combobox]');
    const labels = ['data-count-label', 'data-no-results-label'].map((a) => root?.getAttribute(a));
    expect(labels).toEqual(['{count} pays', 'Aucun pays']);
  });

  it('value : libellé de l’option visée, ou texte libre', async () => {
    expect((await control({ value: 'ee' })).getAttribute('value')).toBe('Estonie');
    expect((await control({ value: 'Japon' })).getAttribute('value')).toBe('Japon');
  });

  it('relie hint par aria-describedby', async () => {
    const document = await render({ hint: 'Tapez pour filtrer.' });
    expect(document.querySelector('input')?.getAttribute('aria-describedby')).toBe('pays-hint');
    expect(document.getElementById('pays-hint')?.textContent?.trim()).toBe('Tapez pour filtrer.');
  });

  it('required : attribut natif, marqueur seulement avec requiredLabel', async () => {
    const bare = await render({ required: true });
    expect(bare.querySelector('input')?.hasAttribute('required')).toBe(true);
    expect(bare.querySelector('.pp-field__required')).toBeNull();
    const marked = await render({ required: true, requiredLabel: 'obligatoire' });
    expect(marked.querySelector('.pp-field__required')?.textContent?.trim()).toBe('obligatoire');
  });

  it('pose aria-invalid="true" seulement si invalid', async () => {
    expect((await control({ invalid: true })).getAttribute('aria-invalid')).toBe('true');
    expect((await control({ invalid: false })).hasAttribute('aria-invalid')).toBe(false);
  });

  it('liste vide : aucune option, listbox présente ; `class` sur la racine Field', async () => {
    const document = await render({ options: [], class: 'placement' });
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    expect(document.querySelector('.pp-field')?.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ invalid: true, required: true, hint: 'Aide', value: 'fr' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Combobox (source CSS)', () => {
  const css = readFileSync(new URL('../src/forms/combobox.css', import.meta.url), 'utf8');

  it('cibles et hauteur par jetons, liste défilable, option active soulignée', () => {
    expect(css).toContain('var(--pp-size-target-min)');
    expect(css).toMatch(/\.pp-combobox__listbox\s*\{[^}]*max-block-size: calc\(var\(--pp-space/);
    expect(css).toMatch(/\.pp-combobox__listbox\s*\{[^}]*overflow-block: auto/);
    expect(css).toMatch(/\[aria-selected='true'\]\s*\{[^}]*text-decoration: underline/);
  });

  it('ni ombre, ni dégradé, ni flou, ni propriété physique', () => {
    expect(css).not.toMatch(/box-shadow|gradient|backdrop-filter|\b(left|right|top|bottom):/);
  });
});
