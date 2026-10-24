/**
 * Comportement de Tooltip conforme à WCAG 2.2, critère 1.4.13 (contenu au survol ou au focus) :
 * affiché au focus clavier et au survol, fermé par Échap sans déplacer le focus, survolable
 * (l'infobulle est dans le conteneur : le pointeur peut y passer), maintenu tant que le focus ou
 * le survol demeure. Sur écran tactile (`(hover: none)`), le texte n'est jamais affiché.
 */

/** Ce qui retient l'infobulle ouverte, et si Échap l'a fermée. */
export interface TooltipState {
  focus: boolean;
  hover: boolean;
  dismissed: boolean;
}

export type TooltipEvent = 'focus' | 'blur' | 'enter' | 'leave' | 'escape';

export const INITIAL_STATE: TooltipState = { focus: false, hover: false, dismissed: false };

/** Chaque événement donne l'état suivant. Un nouveau focus ou survol annule l'effet d'Échap. */
const TRANSITIONS: Readonly<Record<TooltipEvent, (state: TooltipState) => TooltipState>> = {
  focus: (state) => ({ ...state, focus: true, dismissed: false }),
  blur: (state) => ({ ...state, focus: false }),
  enter: (state) => ({ ...state, hover: true, dismissed: false }),
  leave: (state) => ({ ...state, hover: false }),
  escape: (state) => ({ ...state, dismissed: true }),
};

export const nextState = (state: TooltipState, event: TooltipEvent): TooltipState =>
  TRANSITIONS[event](state);

export const isVisible = (state: TooltipState): boolean =>
  (state.focus || state.hover) && !state.dismissed;

/** Ajoute un identifiant à une liste `aria-describedby` sans doublon. */
export function addDescribedBy(current: string | null, id: string): string {
  const ids = (current ?? '').split(/\s+/).filter(Boolean);
  return (ids.includes(id) ? ids : [...ids, id]).join(' ');
}

const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const TOUCH_QUERY = '(hover: none)';

type MediaQuery = (query: string) => { matches: boolean };
type Root = Pick<Document, 'querySelectorAll' | 'addEventListener'>;

/** Relie l'infobulle de ce conteneur à son contrôle ; renvoie sa mise à jour d'état. */
function link(container: Element, interactive: boolean): (event: TooltipEvent) => void {
  const tip = container.querySelector<HTMLElement>('[role="tooltip"]');
  const control = container.querySelector(FOCUSABLE);
  if (!tip || !control) return () => undefined;
  control.setAttribute(
    'aria-describedby',
    addDescribedBy(control.getAttribute('aria-describedby'), tip.id),
  );
  let state = INITIAL_STATE;
  const send = (event: TooltipEvent): void => {
    state = nextState(state, event);
    tip.hidden = !(interactive && isVisible(state));
  };
  if (!interactive) return send;
  const listen = (type: string, event: TooltipEvent): void =>
    container.addEventListener(type, () => send(event));
  listen('focusin', 'focus');
  listen('focusout', 'blur');
  listen('pointerenter', 'enter');
  listen('pointerleave', 'leave');
  return send;
}

/** Installe toutes les infobulles du document ; renvoie le nombre de conteneurs reliés. */
export function install(root: Root, query: MediaQuery = (text) => matchMedia(text)): number {
  const interactive = !query(TOUCH_QUERY).matches;
  const senders = Array.from(root.querySelectorAll('.pp-tooltip'), (container) =>
    link(container, interactive),
  );
  if (interactive) {
    root.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape') senders.forEach((send) => send('escape'));
    });
  }
  return senders.length;
}
