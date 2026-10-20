import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Select from '../src/forms/Select.astro';
import { renderDom } from './render';

type Props = Record<string, unknown>;

const OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'de', label: 'Allemand', disabled: true },
];
const STATE = ['required', 'disabled', 'aria-invalid', 'aria-describedby'];

const render = async (props: Props = {}): Promise<Document> =>
  renderDom(Select, { props: { id: 'langue', name: 'langue', options: OPTIONS, ...props } });

const control = async (props: Props = {}): Promise<HTMLSelectElement> => {
  const element = (await render(props)).querySelector('select');
  if (!element) throw new Error('<select> absent');
  return element as HTMLSelectElement;
};

const options = async (props: Props = {}): Promise<HTMLOptionElement[]> => [
  ...(await control(props)).querySelectorAll('option'),
];

const has = (element: Element | undefined, names: string[]): boolean[] =>
  names.map((name) => element?.hasAttribute(name) ?? false);

const selected = (list: HTMLOptionElement[]): boolean[] =>
  list.map((option) => option.hasAttribute('selected'));

describe('Select (rôles et noms)', () => {
  it('rend un <select> natif simple (combobox implicite), associable par <label for>', async () => {
    const select = await control();
    expect(has(select, ['multiple', 'size', 'role'])).toEqual([false, false, false]);
    expect(select.getAttribute('id')).toBe('langue');
    expect(select.getAttribute('name')).toBe('langue');
  });

  it('nomme chaque option par son libellé, reporte sa valeur et son état', async () => {
    const list = await options();
    expect(list.map((option) => option.textContent?.trim())).toEqual(OPTIONS.map((o) => o.label));
    expect(list.map((option) => option.getAttribute('value'))).toEqual(['fr', 'en', 'de']);
    expect(list.map((option) => option.hasAttribute('disabled'))).toEqual([false, false, true]);
  });

  it('masque le chevron aux technologies d’assistance et au focus', async () => {
    const svg = (await render()).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });
});

describe('Select (valeurs par défaut)', () => {
  it('ne pose ni required, ni disabled, ni ARIA d’état, ni option selected', async () => {
    expect(has(await control(), STATE)).toEqual([false, false, false, false]);
    expect(selected(await options())).toEqual([false, false, false]);
  });

  it('ne pose aucun attribut style', async () => {
    const document = await render({ invalid: true, disabled: true, placeholder: 'Choisir' });
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('transmet `class` à côté de pp-select', async () => {
    const root = (await render({ class: 'placement' })).querySelector('.pp-select');
    expect(root?.classList.contains('placement')).toBe(true);
  });
});

describe('Select (props)', () => {
  it('marque selected la seule option égale à value', async () => {
    expect(selected(await options({ value: 'en' }))).toEqual([false, true, false]);
  });

  it('ajoute un placeholder vide, désactivé et sélectionné sans value', async () => {
    const [first, ...rest] = await options({ placeholder: 'Choisir', required: true });
    expect(first?.getAttribute('value')).toBe('');
    expect(first?.textContent?.trim()).toBe('Choisir');
    expect(has(first, ['disabled', 'selected'])).toEqual([true, true]);
    expect(rest).toHaveLength(OPTIONS.length);
  });

  it('ne sélectionne pas le placeholder quand value est fournie', async () => {
    const list = await options({ placeholder: 'Choisir', value: 'fr' });
    expect(selected(list)).toEqual([false, true, false, false]);
  });

  it('pose required et disabled natifs, aria-invalid et aria-describedby', async () => {
    const props = { required: true, disabled: true, invalid: true, describedBy: 'a b' };
    const select = await control(props);
    expect(has(select, STATE)).toEqual([true, true, true, true]);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('a b');
  });
});

describe('Select (source CSS)', () => {
  const source = readFileSync(new URL('../src/forms/Select.astro', import.meta.url), 'utf8');

  it('retire l’apparence native, sans image de fond ni dégradé', () => {
    expect(source).toContain('appearance: none');
    expect(source).not.toMatch(/background-image|gradient\(/);
  });

  it('s’appuie sur les tokens de contrôle et ne redéfinit pas le focus', () => {
    for (const token of ['size-control-height', 'color-control', 'radius-control']) {
      expect(source).toContain(`var(--pp-${token})`);
    }
    expect(source).not.toMatch(/:focus|outline/);
  });

  it('n’emploie que des propriétés logiques', () => {
    expect(source).not.toMatch(/\b(?:margin|padding|border)-(?:left|right|top|bottom)\b/);
    expect(source).not.toMatch(/^\s*(?:width|height):/m);
  });
});
