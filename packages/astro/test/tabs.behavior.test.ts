import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import { collect, initialIndex, install, nextIndex } from '../src/behaviors/tabs';

const COUNT = 3;
const LAST = COUNT - 1;
const markup = (
  selected = 'a',
  panelB = '<p>B</p>',
) => `<div data-pp-tabs data-selected="${selected}">
<ul data-pp-tabs-list><li><a id="a-tab" href="#a" data-pp-tab>A</a></li>
<li><a id="b-tab" href="#b" data-pp-tab>B</a></li><li><a id="c-tab" href="#c" data-pp-tab>C</a></li></ul>
<section id="a" data-pp-panel><h3 data-pp-panel-title>A</h3><p>A</p></section>
<section id="b" data-pp-panel><h3 data-pp-panel-title>B</h3>${panelB}</section>
<section id="c" data-pp-panel><h3 data-pp-panel-title>C</h3><p>C</p></section></div>`;

const setup = (html = markup()) => parseHTML(`<!doctype html><html><body>${html}</body></html>`);

const fire = (target: Element | null, type: string, props: object = {}) => {
  const Ctor = (target?.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const event = Object.assign(new Ctor(type, { bubbles: true, cancelable: true }), props);
  target?.dispatchEvent(event);
  return event;
};

const press = (target: Element, key: string) => fire(target, 'keydown', { key });
const click = (document: Document, id: string) => fire(document.getElementById(id), 'click');

describe('nextIndex', () => {
  it('flèche droite avance, gauche recule, avec bouclage', () => {
    expect(nextIndex(0, 'ArrowRight', COUNT, false)).toBe(1);
    expect(nextIndex(LAST, 'ArrowRight', COUNT, false)).toBe(0);
    expect(nextIndex(1, 'ArrowLeft', COUNT, false)).toBe(0);
    expect(nextIndex(0, 'ArrowLeft', COUNT, false)).toBe(LAST);
  });

  it('dir="rtl" inverse les flèches ; Home, End et autre touche', () => {
    expect(nextIndex(0, 'ArrowLeft', COUNT, true)).toBe(1);
    expect(nextIndex(0, 'ArrowRight', COUNT, true)).toBe(LAST);
    expect(nextIndex(1, 'Home', COUNT, false)).toBe(0);
    expect(nextIndex(1, 'End', COUNT, false)).toBe(LAST);
    expect(nextIndex(1, 'a', COUNT, false)).toBe(1);
  });
});

describe('collect et initialIndex', () => {
  it('refuse un balisage incomplet ; data-selected inconnu : premier onglet', () => {
    const bad = setup('<div data-pp-tabs><a data-pp-tab>A</a></div>').document;
    expect(collect(bad.querySelector('[data-pp-tabs]') as Element)).toBeNull();
    const { document } = setup();
    const host = document.querySelector('[data-pp-tabs]') as Element;
    const pairs = collect(host)?.pairs ?? [];
    const index = (selected: string) => {
      host.setAttribute('data-selected', selected);
      return initialIndex(host, pairs);
    };
    expect([index('a'), index('c'), index('zzz')]).toEqual([0, LAST, 0]);
  });
});

describe('install', () => {
  it('pose rôles, relations et tabindex itinérant', () => {
    const { document } = setup();
    expect(install(document)).toBe(1);
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    expect(document.querySelector('[role="tablist"]')).not.toBeNull();
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    const selected = tabs.map((tab) => tab.getAttribute('aria-selected'));
    expect(selected).toEqual(['true', 'false', 'false']);
    expect(tabs[1]?.getAttribute('aria-controls')).toBe('b');
    expect(tabs[0]?.hasAttribute('href')).toBe(false);
    const panel = document.getElementById('b') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe('b-tab');
    expect(panel.hidden).toBe(true);
    expect((document.getElementById('a') as HTMLElement).hidden).toBe(false);
    expect(document.querySelector('[data-pp-panel-title]')?.hasAttribute('hidden')).toBe(true);
  });

  it('respecte data-selected et ne s’applique qu’une fois', () => {
    const { document } = setup(markup('b'));
    expect(install(document)).toBe(1);
    expect(install(document)).toBe(0);
    expect(document.getElementById('b-tab')?.getAttribute('aria-selected')).toBe('true');
  });

  it('tabindex="0" sur le panneau actif sans élément focalisable, pas sinon', () => {
    const { document } = setup(markup('b', '<a href="/x">lien</a>'));
    install(document);
    expect(document.getElementById('b')?.hasAttribute('tabindex')).toBe(false);
    click(document, 'a-tab');
    expect(document.getElementById('a')?.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('a')?.hasAttribute('hidden')).toBe(false);
    expect(document.getElementById('b')?.hasAttribute('hidden')).toBe(true);
  });

  it('clavier : active et focalise l’onglet visé, avec bouclage', () => {
    const { document } = setup();
    install(document);
    const first = document.getElementById('a-tab') as HTMLElement;
    const last = document.getElementById('c-tab') as HTMLElement;
    const focus = vi.spyOn(last, 'focus');
    expect(press(first, 'ArrowLeft').defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalled();
    expect(last.getAttribute('aria-selected')).toBe('true');
    press(last, 'ArrowRight');
    expect(first.getAttribute('aria-selected')).toBe('true');
    press(first, 'End');
    expect(last.getAttribute('tabindex')).toBe('0');
  });

  it('clavier : touche non gérée ignorée, dir="rtl" inverse les flèches', () => {
    const { document } = setup(`<div dir="rtl">${markup()}</div>`);
    install(document);
    const first = document.getElementById('a-tab') as HTMLElement;
    expect(press(first, 'x').defaultPrevented).toBe(false);
    press(first, 'ArrowLeft');
    expect(document.getElementById('b-tab')?.getAttribute('aria-selected')).toBe('true');
  });
});
