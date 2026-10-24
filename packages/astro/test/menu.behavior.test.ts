import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import { install, matchTypeahead, nextIndex, TYPEAHEAD_RESET_MS } from '../src/behaviors/menu';

describe('nextIndex', () => {
  it('avance et recule en bouclant, Début et Fin ignorent la position', () => {
    expect([nextIndex(0, 3, 'next'), nextIndex(2, 3, 'next')]).toEqual([1, 0]);
    expect([nextIndex(0, 3, 'prev'), nextIndex(-1, 3, 'prev')]).toEqual([2, 1]);
    expect([nextIndex(1, 4, 'first'), nextIndex(1, 4, 'last')]).toEqual([0, 3]);
  });

  it('menu vide : -1', () => {
    expect([nextIndex(0, 0, 'next'), nextIndex(0, 0, 'first')]).toEqual([-1, -1]);
  });
});
describe('matchTypeahead', () => {
  const labels = ['Copier', 'Coller', 'Supprimer', 'Édition'];

  it('trouve la première entrée qui commence par le caractère, casse ignorée', () => {
    expect([matchTypeahead(labels, 's', -1), matchTypeahead(labels, 'C', -1)]).toEqual([2, 0]);
    expect(matchTypeahead(labels, 'é', -1)).toBe(3);
  });

  it('un caractère répété passe à la suivante et boucle ; plusieurs restent sur la courante', () => {
    expect([matchTypeahead(labels, 'c', 0), matchTypeahead(labels, 'c', 1)]).toEqual([1, 0]);
    expect([matchTypeahead(labels, 'col', 0), matchTypeahead(labels, 'co', 1)]).toEqual([1, 1]);
  });

  it('aucune correspondance ou liste vide : -1', () => {
    expect([matchTypeahead(labels, 'z', 0), matchTypeahead([], 'a', -1)]).toEqual([-1, -1]);
  });
});

const setup = (now = () => 0) => {
  const { document } =
    parseHTML(`<!doctype html><html><body><button id="b" aria-haspopup="menu" aria-controls="m">Actions</button>
<div id="m" role="menu"><button role="menuitem" data-action="copy">Copier</button>
<a role="menuitem" href="/x">Coller</a>
<button role="menuitem" aria-disabled="true" data-action="del">Supprimer</button></div>
</body></html>`);
  const win = document.defaultView as unknown as { Event: typeof Event; CustomEvent: unknown };
  const panel = document.getElementById('m') as HTMLElement;
  const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  const trigger = document.getElementById('b') as HTMLElement;
  let open = false;
  let active: Element | null = null;
  panel.showPopover = vi.fn(() => void (open = true));
  panel.hidePopover = vi.fn(() => void (open = false));
  Object.assign(panel, { matches: () => open });
  Object.defineProperty(document, 'activeElement', { get: () => active });
  for (const element of [trigger, ...items]) element.focus = vi.fn(() => void (active = element));
  vi.stubGlobal('CustomEvent', win.CustomEvent);
  install(document as unknown as Document, now);
  const fire = (target: Element, type: string, extra: object) => {
    const event = Object.assign(new win.Event(type, { bubbles: true, cancelable: true }), extra);
    target.dispatchEvent(event);
    return event;
  };
  const press = (target: Element, key: string) => fire(target, 'keydown', { key });
  return { panel, items, trigger, press, fire, focused: () => active };
};

describe('install', () => {
  it('Flèche bas ouvre et annule l’action par défaut ; Tab sur le bouton reste au navigateur', () => {
    const { panel, trigger, press } = setup();
    expect(press(trigger, 'ArrowDown').defaultPrevented).toBe(true);
    expect(panel.showPopover).toHaveBeenCalledTimes(1);
    expect(press(trigger, 'Tab').defaultPrevented).toBe(false);
  });

  it('à l’ouverture par Flèche haut, aria-expanded passe à true et le focus va à la dernière', () => {
    const { panel, items, trigger, press, fire, focused } = setup();
    press(trigger, 'ArrowUp');
    fire(panel, 'toggle', { newState: 'open' });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(focused()).toBe(items[2]);
  });

  it('les flèches, Début et Fin déplacent le focus en bouclant', () => {
    const { items, press, focused } = setup();
    press(items[0] as Element, 'ArrowDown');
    expect(focused()).toBe(items[0]);
    press(items[0] as Element, 'End');
    expect(focused()).toBe(items[2]);
    press(items[2] as Element, 'ArrowDown');
    expect(focused()).toBe(items[0]);
    press(items[0] as Element, 'ArrowUp');
    expect(focused()).toBe(items[2]);
  });

  it('la frappe de caractères focalise l’entrée correspondante, puis oublie après le délai', () => {
    let time = 0;
    const { items, press, focused } = setup(() => time);
    items[0]?.focus();
    press(items[0] as Element, 'c');
    expect(focused()).toBe(items[1]);
    time = TYPEAHEAD_RESET_MS + 1;
    press(items[1] as Element, 's');
    expect(focused()).toBe(items[2]);
  });

  it('Échap ferme et rend le focus au bouton ; Tab ferme sans annuler la touche', () => {
    const { panel, items, trigger, press, focused } = setup();
    expect(press(items[0] as Element, 'Escape').defaultPrevented).toBe(true);
    expect(focused()).toBe(trigger);
    expect(press(items[0] as Element, 'Tab').defaultPrevented).toBe(false);
    expect(panel.hidePopover).toHaveBeenCalledTimes(2);
    expect(press(items[0] as Element, 'F5').defaultPrevented).toBe(false);
  });

  it('un clic émet l’action et ferme ; une entrée désactivée ne fait rien', () => {
    const { panel, items } = setup();
    const heard = vi.fn();
    panel.addEventListener('pp-menu-action', heard);
    items[0]?.click();
    items[2]?.click();
    expect(panel.hidePopover).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
