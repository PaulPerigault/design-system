/** Comportement du Menu (APG « Menu Button »). Sans ce script, `popovertarget` ouvre le panneau. */
export type Move = 'next' | 'prev' | 'first' | 'last';
type Keys = Readonly<Record<string, Move>>;
/** Délai sans frappe après lequel la saisie en cours est oubliée (millisecondes). */
export const TYPEAHEAD_RESET_MS = 500;
const MOVES: Keys = { ArrowDown: 'next', ArrowUp: 'prev', Home: 'first', End: 'last' };
const START: Keys = { ArrowDown: 'first', ArrowUp: 'last' };

/** Index visé par un déplacement ; les flèches bouclent. `count` nul : -1. */
export function nextIndex(current: number, count: number, move: Move): number {
  if (count <= 0) return -1;
  if (move === 'first' || move === 'last') return move === 'first' ? 0 : count - 1;
  return (current + (move === 'next' ? 1 : -1) + count) % count;
}

/**
 * Index de la première entrée dont le libellé commence par `typed` (casse ignorée), en bouclant.
 * Un caractère part de l'entrée suivant `current`, plusieurs repartent de `current`. -1 sinon.
 */
export function matchTypeahead(labels: readonly string[], typed: string, current: number): number {
  const wanted = typed.toLocaleLowerCase();
  const start = [...wanted].length === 1 ? current + 1 : Math.max(current, 0);
  for (let offset = 0; offset < labels.length; offset += 1) {
    const index = (start + offset) % labels.length;
    if (labels[index]?.trim().toLocaleLowerCase().startsWith(wanted)) return index;
  }
  return -1;
}

type Ctx = { doc: Document; now: () => number; last: boolean; typed: string; at: number };
type El = HTMLElement;

const ITEMS = '[role="menuitem"]';
const itemsOf = (panel: Element): El[] => [...panel.querySelectorAll<El>(ITEMS)];
const triggerOf = (doc: Document, panel: Element): El | null =>
  doc.querySelector<El>(`[aria-controls="${panel.id}"]`);
const isChar = (e: KeyboardEvent): boolean =>
  e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

/** Repli sans ancrage CSS : position du panneau sous le bouton, par propriétés personnalisées. */
function placeBelow(doc: Document, panel: El): void {
  if (globalThis.CSS?.supports('position-area', 'block-end')) return;
  const box = triggerOf(doc, panel)?.getBoundingClientRect();
  panel.style.setProperty('--menu-inline', `${box?.left ?? 0}px`);
  panel.style.setProperty('--menu-block', `${box?.bottom ?? 0}px`);
}

function onTrigger(ctx: Ctx, event: KeyboardEvent, trigger: El): void {
  const move = START[event.key];
  const panel = ctx.doc.getElementById(trigger.getAttribute('aria-controls') ?? '');
  if (!move || !panel) return;
  event.preventDefault();
  ctx.last = move === 'last';
  const items = itemsOf(panel);
  if (panel.matches(':popover-open')) items[nextIndex(0, items.length, move)]?.focus();
  else panel.showPopover();
}

function close(ctx: Ctx, panel: El): void {
  panel.hidePopover();
  triggerOf(ctx.doc, panel)?.focus();
}

function search(ctx: Ctx, key: string, items: El[], current: number): void {
  const time = ctx.now();
  ctx.typed = time - ctx.at > TYPEAHEAD_RESET_MS ? key : ctx.typed + key;
  ctx.at = time;
  const labels = items.map((item) => item.textContent ?? '');
  items[matchTypeahead(labels, ctx.typed, current)]?.focus();
}

/** Touche gérée dans le panneau ; faux si elle n'est pas du menu. */
function runKey(ctx: Ctx, event: KeyboardEvent, panel: El): boolean {
  const items = itemsOf(panel);
  const current = items.indexOf(ctx.doc.activeElement as El);
  const move = MOVES[event.key];
  if (move) items[nextIndex(current, items.length, move)]?.focus();
  else if (event.key === 'Escape') close(ctx, panel);
  else if (event.key === 'Enter' || event.key === ' ') items[current]?.click();
  else if (isChar(event)) search(ctx, event.key, items, current);
  else return false;
  return true;
}

function onClick(event: MouseEvent): void {
  const item = (event.target as Element | null)?.closest<El>(ITEMS);
  const panel = item?.closest<El>('[role="menu"]');
  if (!item || !panel) return;
  if (item.getAttribute('aria-disabled') === 'true') return event.preventDefault();
  const action = item.dataset.action;
  if (action) panel.dispatchEvent(new CustomEvent('pp-menu-action', { detail: { action } }));
  panel.hidePopover();
}

function onToggle(ctx: Ctx, event: Event): void {
  const panel = event.target as El;
  if (panel.getAttribute?.('role') !== 'menu') return;
  const open = (event as ToggleEvent).newState === 'open';
  const items = itemsOf(panel);
  triggerOf(ctx.doc, panel)?.setAttribute('aria-expanded', String(open));
  if (open) placeBelow(ctx.doc, panel);
  if (open) items[ctx.last ? items.length - 1 : 0]?.focus();
  ctx.last = false;
}

/** Installe les écouteurs du Menu sur le document (délégation, un seul appel par page). */
export function install(doc: Document, now: () => number = Date.now): void {
  const ctx: Ctx = { doc, now, last: false, typed: '', at: 0 };
  doc.addEventListener('keydown', (event) => {
    const target = event.target as Element | null;
    const trigger = target?.closest<El>('[aria-haspopup="menu"]');
    const panel = target?.closest<El>('[role="menu"]');
    if (trigger) onTrigger(ctx, event, trigger);
    // Tab ferme sans être annulé : le focus part du bouton vers l'élément suivant de la page.
    else if (panel && event.key === 'Tab') close(ctx, panel);
    else if (panel && runKey(ctx, event, panel)) event.preventDefault();
  });
  doc.addEventListener('click', onClick);
  doc.addEventListener('toggle', (event) => onToggle(ctx, event), true);
}
