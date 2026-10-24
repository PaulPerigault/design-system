import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import * as combobox from '../src/behaviors/combobox';
import type { ComboState } from '../src/behaviors/combobox';

const { enhance, filterOptions, normalize, onQuery, optionId, reduceKey, statusText } = combobox;
const OPTIONS = [
  { value: 'fr', label: 'France' },
  { value: 'ee', label: 'Estonie' },
  { value: 'eg', label: 'Égypte' },
];
const at = (active: number, open = true, count = 3): ComboState => ({ open, active, count });
const CLOSED = at(-1, false);
const EMPTY = at(-1, false, 0);
const values = (query: string) => filterOptions(OPTIONS, query).map((option) => option.value);

describe('normalize, filterOptions, onQuery, statusText', () => {
  it('filtre sans casse ni accents, dans tout le libellé ; vide : toutes', () => {
    expect(normalize('  ÉgyPTE ')).toBe('egypte');
    expect([values('EG'), values('égy'), values('on')]).toEqual([['eg'], ['eg'], ['ee']]);
    expect(values('')).toEqual(['fr', 'ee', 'eg']);
    expect([values('zz'), filterOptions([], 'fr')]).toEqual([[], []]);
  });
  it('onQuery ouvre s’il reste des options, sans active ; statusText remplace {count}', () => {
    expect([onQuery(2), onQuery(0)]).toEqual([at(-1, true, 2), EMPTY]);
    expect(statusText(2, '{count} résultats ({count})', 'Aucun')).toBe('2 résultats (2)');
    expect(statusText(0, '{count} résultats', 'Aucun')).toBe('Aucun');
  });
});

// [cas, état, touche, état attendu, effet, touche consommée]
const KEY_CASES: [string, ComboState, string, ComboState, string, boolean][] = [
  ['bas fermé : première option', CLOSED, 'ArrowDown', at(0), 'none', true],
  ['bas : suivante', at(0), 'ArrowDown', at(1), 'none', true],
  ['bas en fin : boucle', at(2), 'ArrowDown', at(0), 'none', true],
  ['haut fermé : dernière option', CLOSED, 'ArrowUp', at(2), 'none', true],
  ['haut : précédente', at(1), 'ArrowUp', at(0), 'none', true],
  ['haut en tête : boucle', at(0), 'ArrowUp', at(2), 'none', true],
  ['haut ouvert sans active : dernière', at(-1), 'ArrowUp', at(2), 'none', true],
  ['flèche sans option : reste fermé', EMPTY, 'ArrowDown', EMPTY, 'none', true],
  ['Entrée : valide et ferme', at(1), 'Enter', CLOSED, 'commit', true],
  ['Entrée sans active : formulaire', at(-1), 'Enter', at(-1), 'none', false],
  ['Entrée fermé : formulaire', CLOSED, 'Enter', CLOSED, 'none', false],
  ['Échap ouvert : ferme', at(1), 'Escape', CLOSED, 'none', true],
  ['second Échap : vide le champ', CLOSED, 'Escape', CLOSED, 'clear', true],
  ['Tab : ferme sans valider', at(1), 'Tab', CLOSED, 'none', false],
  ['Home : curseur du champ', at(1), 'Home', at(1), 'none', false],
  ['End : curseur du champ', at(1), 'End', at(1), 'none', false],
  ['clé héritée de Object : ignorée', at(1), 'toString', at(1), 'none', false],
];

describe('reduceKey', () => {
  it.each(KEY_CASES.map((row) => [row[0], row] as const))('%s', (_, row) => {
    const [, state, key, expected, effect, handled] = row;
    expect(reduceKey(state, key)).toEqual({ state: expected, effect, handled });
  });
});

const items = OPTIONS.map((o, i) => `<li role="option" id="${optionId('c', i)}">${o.label}</li>`);
const { document: doc, Event: DomEvent } = parseHTML(`<!doctype html><html><body></body></html>`);
const fire = (target: Element, type: string, key?: string): Event => {
  const event = new DomEvent(type, { bubbles: true, cancelable: true }) as Event;
  if (key) Object.defineProperty(event, 'key', { value: key });
  target.dispatchEvent(event);
  return event;
};

const setup = () => {
  doc.body.innerHTML = `<div data-pp-combobox data-count-label="{count} pays"
    data-no-results-label="Aucun pays"><input role="combobox" list="l" />
    <ul role="listbox" hidden>${items.join('')}</ul><p role="status"></p></div>`;
  const root = doc.querySelector('[data-pp-combobox]') as HTMLElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const listbox = root.querySelector('ul') as HTMLElement;
  return { ok: enhance(root), root, input, listbox, status: root.querySelector('p') };
};

describe('enhance (DOM injecté)', () => {
  it('refuse un balisage incomplet ; sinon retire le list natif', () => {
    doc.body.innerHTML = '<div><input role="combobox"></div>';
    expect(enhance(doc.querySelector('div') as HTMLElement)).toBe(false);
    const { ok, root, input } = setup();
    expect([ok, input.hasAttribute('list'), root.dataset.enhanced]).toEqual([true, false, 'true']);
  });

  it('filtre à la saisie et annonce le nombre, sans option active', () => {
    const { input, listbox, status } = setup();
    input.value = 'e';
    fire(input, 'input');
    expect([status?.textContent, listbox.hidden]).toEqual(['3 pays', false]);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    input.value = 'zz';
    fire(input, 'input');
    expect([status?.textContent, listbox.hidden]).toEqual(['Aucun pays', true]);
  });

  it('flèches puis Entrée : option active, puis libellé écrit dans le champ', () => {
    const { input, listbox } = setup();
    expect(fire(input, 'keydown', 'ArrowDown').defaultPrevented).toBe(true);
    fire(input, 'keydown', 'ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe('c-option-1');
    expect(listbox.querySelector('[aria-selected="true"]')?.id).toBe('c-option-1');
    fire(input, 'keydown', 'Enter');
    expect([input.value, listbox.hidden]).toEqual(['Estonie', true]);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('Échap deux fois : ferme puis vide ; clic sur une option : la valide', () => {
    const { input, listbox } = setup();
    input.value = 'Fr';
    fire(input, 'keydown', 'ArrowDown');
    fire(input, 'keydown', 'Escape');
    expect([listbox.hidden, input.value]).toEqual([true, 'Fr']);
    fire(input, 'keydown', 'Escape');
    expect(input.value).toBe('');
    fire(listbox.querySelectorAll('li')[2] as Element, 'click');
    expect(input.value).toBe('Égypte');
  });
});
