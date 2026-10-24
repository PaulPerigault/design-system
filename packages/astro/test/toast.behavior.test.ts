import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_DURATION_MS, dismiss, install, onEscape, show } from '../src/behaviors/toast';

const SHORT_MS = 500;
const HTML = '<!doctype html><body><div class="pp-toast-region" data-dismiss-label="Fermer"></div>';

const setup = () => {
  const { document, window } = parseHTML(HTML);
  const region = document.querySelector('.pp-toast-region') as Element;
  const callbacks = new Map<number, () => void>();
  let next = 0;
  const timers = {
    setTimeout: vi.fn((handler: () => void) => {
      callbacks.set(++next, handler);
      return next;
    }),
    clearTimeout: vi.fn((id: unknown) => void callbacks.delete(id as number)),
  };
  const send = (el: Element, type: string) => el.dispatchEvent(new window.Event(type));
  const open = (options = {}) => show(region, { message: 'x', ...options }, timers);
  return { region, timers, callbacks, send, open };
};

describe('show', () => {
  it('crée un toast neutre avec message et bouton de fermeture libellé', () => {
    const { region, open } = setup();
    const toast = open({ message: 'Enregistré' });
    const close = toast.querySelector('button');
    expect(toast.parentElement).toBe(region);
    expect(toast.getAttribute('data-tone')).toBe('neutral');
    expect(toast.querySelector('p')?.textContent).toBe('Enregistré');
    expect([close?.textContent, close?.getAttribute('type')]).toEqual(['Fermer', 'button']);
    expect(toast.hasAttribute('style')).toBe(false);
  });

  it.each(['success', 'error'] as const)('pose le ton %s', (tone) => {
    expect(setup().open({ tone }).getAttribute('data-tone')).toBe(tone);
  });

  it('insère le message comme texte, jamais comme HTML', () => {
    const toast = setup().open({ message: '<b>gras</b>' });
    expect([toast.querySelector('b'), toast.textContent]).toEqual([null, '<b>gras</b>Fermer']);
  });

  it('ferme au bouton', () => {
    const { region, send, open } = setup();
    send(open().querySelector('button') as Element, 'click');
    expect(region.children).toHaveLength(0);
  });
});

describe('durée', () => {
  it('utilise 8 000 ms par défaut puis ferme', () => {
    const { region, timers, callbacks, open } = setup();
    open();
    expect(timers.setTimeout).toHaveBeenCalledWith(expect.any(Function), DEFAULT_DURATION_MS);
    callbacks.forEach((handler) => handler());
    expect([DEFAULT_DURATION_MS, region.children.length]).toEqual([8000, 0]);
  });

  it('respecte une durée explicite ; duration 0 : jamais fermé seul', () => {
    const { region, timers, open } = setup();
    open({ duration: SHORT_MS });
    expect(timers.setTimeout).toHaveBeenCalledWith(expect.any(Function), SHORT_MS);
    timers.setTimeout.mockClear();
    open({ duration: 0 });
    expect([timers.setTimeout.mock.calls.length, region.children.length]).toEqual([0, 2]);
  });
});

describe('suspension (WCAG 2.2.1)', () => {
  it.each([
    ['mouseenter', 'mouseleave'],
    ['focusin', 'focusout'],
  ])('%s suspend le minuteur, %s le relance', (enter, leave) => {
    const { timers, callbacks, send, open } = setup();
    const toast = open();
    send(toast, enter);
    expect(callbacks.size).toBe(0);
    send(toast, leave);
    expect([callbacks.size, timers.setTimeout.mock.calls.length]).toEqual([1, 2]);
  });

  it('reste suspendu tant que survol ou focus subsiste', () => {
    const { callbacks, send, open } = setup();
    const toast = open();
    ['mouseenter', 'focusin', 'mouseleave'].forEach((type) => send(toast, type));
    const during = callbacks.size;
    send(toast, 'focusout');
    expect([during, callbacks.size]).toEqual([0, 1]);
  });
});

describe('Échap et dismiss', () => {
  it('Échap ferme le toast qui contient la cible', () => {
    const { region, open } = setup();
    const target = open().querySelector('button');
    expect([onEscape({ key: 'Escape', target }), region.children.length]).toEqual([true, 0]);
  });

  it('ignore les autres touches et les cibles hors toast', () => {
    const { region, open } = setup();
    const results = [
      onEscape({ key: 'Enter', target: open() }),
      onEscape({ key: 'Escape', target: region }),
      onEscape({ key: 'Escape', target: null }),
    ];
    expect(results).toEqual([false, false, false]);
  });

  it('install branche keydown ; dismiss annule le minuteur', () => {
    const addEventListener = vi.fn();
    install({ addEventListener });
    expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    const { region, callbacks, open } = setup();
    dismiss(open());
    expect(callbacks.size + region.children.length).toBe(0);
  });
});
