/**
 * Repère d'étapes : la liste de référence devient l'indicateur (un bouton par étape, `aria-current`)
 * avec Précédent et Suivant ; le reste du texte reste dans le DOM. `remove` rend la liste du serveur.
 */
import { progressText } from './milestones-3d-text';
import { itemId, type Parts } from './milestones-3d-view';

export interface StepHandlers {
  pick(id: string): void;
  hover(id: string | null): void;
  move(delta: number): void;
}

export interface Steps {
  update(i: number): void;
  hover(id: string | null): void;
  remove(): void;
}

const NAME = '[data-pp-name]';
const FIRST = 0;
const STEP = 1;
const HALF = 2;

function button(doc: Document, className: string, label: string): HTMLButtonElement {
  const element = doc.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  return element;
}

/** Focus au clavier seulement (un clic laisse le focus sans survol de la médaille). */
function keyboardFocus(element: HTMLElement): boolean {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}

function addStepButton(item: HTMLElement, handlers: StepHandlers): void {
  const name = item.querySelector(NAME);
  if (!name) return;
  const id = itemId(item);
  const step = button(item.ownerDocument, 'pp-milestones__select', name.textContent ?? '');
  step.addEventListener('click', () => handlers.pick(id));
  step.addEventListener('focus', () => keyboardFocus(step) && handlers.hover(id));
  step.addEventListener('blur', () => handlers.hover(null));
  step.addEventListener('pointerenter', () => handlers.hover(id));
  step.addEventListener('pointerleave', () => handlers.hover(null));
  name.replaceChildren(step);
}

/** Centre l'étape dans la bande des étapes, sans toucher au défilement de la page. */
function centre(list: HTMLElement, item: HTMLElement | undefined): void {
  if (!item || typeof list.scrollTo !== 'function') return;
  const left = item.offsetLeft - (list.clientWidth - item.offsetWidth) / HALF;
  list.scrollTo({ left, behavior: 'auto' });
}

/** Liens masqués visuellement de la liste : hors de l'ordre de tabulation tant que c'est un repère. */
function setLinksTabbable(items: HTMLElement[], tabbable: boolean): void {
  const links = items.flatMap((item) => Array.from(item.querySelectorAll('a')));
  links.forEach((link) => {
    if (tabbable) link.removeAttribute('tabindex');
    else link.setAttribute('tabindex', '-1');
  });
}

/** Précédent, position et Suivant, après la liste. */
function addNav(parts: Parts, handlers: StepHandlers) {
  const { host, list } = parts;
  const doc = host.ownerDocument;
  const label = (name: string): string => host.getAttribute(name) ?? '';
  const previous = button(doc, 'pp-milestones__nav-button', label('data-pp-previous'));
  const next = button(doc, 'pp-milestones__nav-button', label('data-pp-next'));
  const position = doc.createElement('span');
  position.className = 'pp-milestones__position';
  const nav = doc.createElement('div');
  nav.className = 'pp-milestones__nav';
  nav.append(previous, position, next);
  list.after(nav);
  previous.addEventListener('click', () => handlers.move(-STEP));
  next.addEventListener('click', () => handlers.move(STEP));
  return { nav, previous, next, position };
}

export function addSteps(parts: Parts, handlers: StepHandlers): Steps {
  const { host, list, items } = parts;
  items.forEach((item) => addStepButton(item, handlers));
  setLinksTabbable(items, false);
  list.setAttribute('aria-label', host.getAttribute('data-pp-steps') ?? '');
  const { nav, previous, next, position } = addNav(parts, handlers);
  return {
    update(index) {
      const template = host.getAttribute('data-pp-progress') ?? '';
      position.textContent = progressText(template, index + STEP, items.length);
      previous.setAttribute('aria-disabled', String(index === FIRST));
      next.setAttribute('aria-disabled', String(index === items.length - STEP));
      centre(list, items[index]);
    },
    hover(id) {
      items.forEach((item) =>
        item.toggleAttribute('data-hover', id !== null && itemId(item) === id),
      );
    },
    remove() {
      items.forEach((item) => {
        const name = item.querySelector(NAME);
        name?.replaceChildren(name.textContent ?? '');
        item.removeAttribute('data-active');
        item.removeAttribute('data-hover');
      });
      setLinksTabbable(items, true);
      list.removeAttribute('aria-label');
      nav.remove();
    },
  };
}
