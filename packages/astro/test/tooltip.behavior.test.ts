import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import {
  INITIAL_STATE,
  addDescribedBy,
  install,
  isVisible,
  nextState,
  type TooltipEvent,
} from '../src/behaviors/tooltip';

const run = (...events: TooltipEvent[]) => events.reduce(nextState, INITIAL_STATE);

describe('nextState / isVisible', () => {
  it('visible au focus ou au survol, masqué sans les deux', () => {
    expect(isVisible(run('focus'))).toBe(true);
    expect(isVisible(run('enter'))).toBe(true);
    expect(isVisible(run('focus', 'blur'))).toBe(false);
    expect(isVisible(INITIAL_STATE)).toBe(false);
  });

  it('reste visible tant que le focus ou le survol demeure', () => {
    expect(isVisible(run('focus', 'enter', 'leave'))).toBe(true);
    expect(isVisible(run('focus', 'enter', 'blur'))).toBe(true);
  });

  it('Échap ferme ; un nouveau focus ou survol rouvre', () => {
    expect(isVisible(run('focus', 'escape'))).toBe(false);
    expect(isVisible(run('focus', 'escape', 'enter'))).toBe(true);
    expect(isVisible(run('enter', 'escape', 'focus'))).toBe(true);
  });

  it('ne modifie pas l’état reçu', () => {
    nextState(INITIAL_STATE, 'focus');
    expect(INITIAL_STATE.focus).toBe(false);
  });
});

describe('addDescribedBy', () => {
  it('ajoute sans doublon et conserve l’existant', () => {
    expect(addDescribedBy(null, 'a')).toBe('a');
    expect(addDescribedBy('b', 'a')).toBe('b a');
    expect(addDescribedBy('a b', 'a')).toBe('a b');
  });
});

const page = () =>
  parseHTML(`<span class="pp-tooltip"><button>Copier</button>
<span role="tooltip" id="aide" hidden>Aide</span></span><p class="pp-tooltip">Sans contrôle</p>`);

const fire = (window: unknown, target: Element | Document, type: string, key?: string) => {
  const event = new (window as { Event: typeof Event }).Event(type);
  if (key) Object.assign(event, { key });
  target.dispatchEvent(event);
};

describe('install', () => {
  const touch = (matches: boolean) => vi.fn(() => ({ matches }));

  it('relie le contrôle, affiche au focus et au survol, ferme avec Échap', () => {
    const { document, window } = page();
    const button = document.querySelector('button') as HTMLElement;
    const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
    const container = document.querySelector('.pp-tooltip') as Element;
    expect(install(document, touch(false))).toBe(2);
    expect(button.getAttribute('aria-describedby')).toBe('aide');
    fire(window, container, 'focusin');
    expect(tip.hidden).toBe(false);
    fire(window, document, 'keydown', 'Escape');
    expect(tip.hidden).toBe(true);
    fire(window, container, 'pointerenter');
    expect(tip.hidden).toBe(false);
    fire(window, container, 'focusout');
    expect(tip.hidden).toBe(false);
    fire(window, container, 'pointerleave');
    expect(tip.hidden).toBe(true);
  });

  it('ignore les autres touches', () => {
    const { document, window } = page();
    const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
    install(document, touch(false));
    fire(window, document.querySelector('.pp-tooltip') as Element, 'focusin');
    fire(window, document, 'keydown', 'a');
    expect(tip.hidden).toBe(false);
  });

  it('sur écran tactile : description reliée, texte jamais affiché', () => {
    const { document, window } = page();
    const query = touch(true);
    install(document, query);
    const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
    fire(window, document.querySelector('.pp-tooltip') as Element, 'focusin');
    expect(query).toHaveBeenCalledWith('(hover: none)');
    expect(tip.hidden).toBe(true);
    expect(document.querySelector('button')?.getAttribute('aria-describedby')).toBe('aide');
  });
});
