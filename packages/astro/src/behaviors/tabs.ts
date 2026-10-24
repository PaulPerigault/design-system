/**
 * Comportement de Tabs (motif APG « Tabs », activation automatique). Le rendu serveur est une
 * suite de sections sous une liste de liens d'ancre : ce module la transforme en `tablist`,
 * `tab` et `tabpanel`, avec un `tabindex` itinérant et les panneaux inactifs en `hidden`.
 */

export const HOST_SELECTOR = '[data-pp-tabs]';

const FIRST = 0;
const STEP = 1;
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/** Touches gérées : les flèches suivent le sens d'écriture, Home et End vont aux extrémités. */
export const KEYS: readonly string[] = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];

/** Indice de l'onglet visé par une touche, avec bouclage ; `current` pour une autre touche. */
export function nextIndex(current: number, key: string, count: number, rtl: boolean): number {
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === 'Home') return FIRST;
  if (key === 'End') return count - STEP;
  if (key === forward) return (current + STEP) % count;
  if (key === backward) return (current - STEP + count) % count;
  return current;
}

/** Un onglet et le panneau qu'il commande. */
export interface Pair {
  tab: HTMLElement;
  panel: HTMLElement;
}

export interface Parts {
  list: HTMLElement;
  pairs: Pair[];
}

const all = (host: Element, selector: string): HTMLElement[] =>
  Array.from(host.querySelectorAll<HTMLElement>(selector));

/** Éléments du composant, ou null si le balisage ne correspond pas (onglets et panneaux pairés). */
export function collect(host: Element): Parts | null {
  const list = host.querySelector<HTMLElement>('[data-pp-tabs-list]');
  const panels = all(host, '[data-pp-panel]');
  const pairs = all(host, '[data-pp-tab]').flatMap((tab, position) => {
    const panel = panels[position];
    return panel ? [{ tab, panel }] : [];
  });
  const valid = list !== null && pairs.length === panels.length && pairs.length > STEP;
  return valid ? { list, pairs } : null;
}

const hasFocusable = (panel: HTMLElement): boolean => panel.querySelector(FOCUSABLE) !== null;

/** Active l'onglet `index` : un seul `tabindex="0"`, un seul panneau visible. */
export function select({ pairs }: Parts, index: number): void {
  pairs.forEach(({ tab, panel }, position) => {
    const active = position === index;
    tab.setAttribute('aria-selected', String(active));
    tab.setAttribute('tabindex', active ? '0' : '-1');
    panel.hidden = !active;
    if (active && !hasFocusable(panel)) panel.setAttribute('tabindex', '0');
    else panel.removeAttribute('tabindex');
  });
}

function applyRoles({ list, pairs }: Parts): void {
  list.setAttribute('role', 'tablist');
  list.querySelectorAll('li').forEach((item) => item.setAttribute('role', 'none'));
  pairs.forEach(({ tab, panel }) => {
    tab.setAttribute('role', 'tab');
    tab.removeAttribute('href');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.querySelector('[data-pp-panel-title]')?.setAttribute('hidden', '');
  });
}

const isRtl = (host: Element): boolean => host.closest('[dir]')?.getAttribute('dir') === 'rtl';

function bind(host: Element, parts: Parts): void {
  const { list, pairs } = parts;
  pairs.forEach(({ tab }, position) => {
    tab.addEventListener('click', () => select(parts, position));
  });
  list.addEventListener('keydown', (event) => {
    const current = pairs.findIndex(({ tab }) => tab === event.target);
    if (current < FIRST || !KEYS.includes(event.key)) return;
    event.preventDefault();
    const target = nextIndex(current, event.key, pairs.length, isRtl(host));
    select(parts, target);
    pairs[target]?.tab.focus();
  });
}

/** Onglet de départ : `data-selected` (id de panneau) s'il existe, sinon le premier. */
export function initialIndex(host: Element, pairs: Pair[]): number {
  const found = pairs.findIndex(({ panel }) => panel.id === host.getAttribute('data-selected'));
  return Math.max(found, FIRST);
}

/** Transforme chaque composant Tabs sous `root` ; renvoie le nombre de composants transformés. */
export function install(root: ParentNode): number {
  let count = 0;
  root.querySelectorAll(HOST_SELECTOR).forEach((host) => {
    const parts = collect(host);
    if (!parts || host.hasAttribute('data-enhanced')) return;
    applyRoles(parts);
    select(parts, initialIndex(host, parts.pairs));
    bind(host, parts);
    host.setAttribute('data-enhanced', '');
    count += STEP;
  });
  return count;
}
