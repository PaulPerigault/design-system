/**
 * Comportement de Toast : crée un toast dans la région posée par `Toast.astro`, le ferme au bouton
 * ou à Échap, et ferme seul après `duration` ms. Le minuteur est suspendu au survol et au focus
 * dans le toast (WCAG 2.2, critère 2.2.1) ; il repart du début de la durée quand les deux cessent.
 */

export type Tone = 'neutral' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: Tone;
  /** Durée en ms avant fermeture automatique ; 0 : jamais fermé automatiquement. */
  duration?: number;
}

/** Minuteurs injectables (tests) ; les identifiants restent opaques. */
export interface Timers {
  setTimeout(handler: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

export const DEFAULT_DURATION_MS = 8000;
export const TOAST_CLASS = 'pp-toast';

const defaultTimers: Timers = {
  setTimeout: (handler, ms) => globalThis.setTimeout(handler, ms),
  clearTimeout: (id) => globalThis.clearTimeout(id as number),
};

/** Annule le minuteur d'un toast encore ouvert. */
const stoppers = new WeakMap<Element, () => void>();

const hasClosest = (value: unknown): value is Pick<Element, 'closest'> =>
  typeof value === 'object' && value !== null && 'closest' in value;

/** Ferme un toast et annule son minuteur. */
export function dismiss(element: Element): void {
  stoppers.get(element)?.();
  stoppers.delete(element);
  element.remove();
}

function build(region: Element, message: string, tone: Tone): Element {
  const doc = region.ownerDocument;
  const toast = doc.createElement('div');
  toast.className = TOAST_CLASS;
  toast.setAttribute('data-tone', tone);
  const text = doc.createElement('p');
  text.className = `${TOAST_CLASS}__message`;
  text.textContent = message;
  const close = doc.createElement('button');
  close.type = 'button';
  close.className = `${TOAST_CLASS}__close`;
  close.textContent = region.getAttribute('data-dismiss-label') ?? '';
  close.addEventListener('click', () => dismiss(toast));
  toast.append(text, close);
  return toast;
}

/** Ferme le toast après `duration`, sauf pendant le survol ou le focus. */
function autoDismiss(toast: Element, duration: number, timers: Timers): void {
  let id: unknown;
  const state = { hover: false, focus: false };
  const stop = (): void => {
    if (id !== undefined) timers.clearTimeout(id);
    id = undefined;
  };
  const sync = (): void => {
    stop();
    if (!state.hover && !state.focus) id = timers.setTimeout(() => dismiss(toast), duration);
  };
  const track = (type: string, key: keyof typeof state, value: boolean): void =>
    toast.addEventListener(type, () => {
      state[key] = value;
      sync();
    });
  track('mouseenter', 'hover', true);
  track('mouseleave', 'hover', false);
  track('focusin', 'focus', true);
  track('focusout', 'focus', false);
  stoppers.set(toast, stop);
  sync();
}

/** Ajoute un toast à la région et le renvoie. */
export function show(
  region: Element,
  options: ToastOptions,
  timers: Timers = defaultTimers,
): Element {
  const { message, tone = 'neutral', duration = DEFAULT_DURATION_MS } = options;
  const toast = build(region, message, tone);
  region.append(toast);
  if (duration > 0) autoDismiss(toast, duration, timers);
  return toast;
}

/** Échap dans un toast (donc sur le bouton qui a le focus) le ferme ; vrai si fermé. */
export function onEscape(event: { key: string; target: unknown }): boolean {
  const toast =
    event.key === 'Escape' && hasClosest(event.target)
      ? event.target.closest(`.${TOAST_CLASS}`)
      : null;
  if (toast) dismiss(toast);
  return toast !== null;
}

/** Branche Échap sur le document (ou toute racine d'événements). */
export function install(root: Pick<Document, 'addEventListener'>): void {
  root.addEventListener('keydown', (event) => onEscape(event));
}
