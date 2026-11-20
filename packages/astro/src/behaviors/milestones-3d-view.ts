/**
 * Vue de Milestones3D : lecture du balisage serveur, sélecteurs, panneau de détail. Aucun
 * rendu 3D ici. La liste reste la source de vérité : en mode amélioré, le libellé de chaque jalon
 * devient un bouton (`aria-pressed`) et le panneau copie le jalon actif.
 */

export interface Parts {
  host: HTMLElement;
  stage: HTMLElement;
  panel: HTMLElement;
  /** Un élément par jalon, dans l'ordre de la liste. */
  items: HTMLElement[];
  /** Données du bloc JSON : validées plus tard par le paquet 3D, jamais ici. */
  data: unknown;
}

const FIRST = 0;
const SELECT_CLASS = 'pp-milestones__select';
const NAME = '[data-pp-name]';

const parse = (host: Element): unknown => {
  try {
    return JSON.parse(host.querySelector('[data-pp-data]')?.textContent ?? '');
  } catch {
    return null;
  }
};

/** Éléments du composant, ou null si le balisage ne correspond pas. */
export function collect(host: Element): Parts | null {
  const stage = host.querySelector<HTMLElement>('[data-pp-stage]');
  const panel = host.querySelector<HTMLElement>('[data-pp-panel]');
  const items = Array.from(host.querySelectorAll<HTMLElement>('[data-pp-item]'));
  const data = parse(host);
  if (!stage || !panel || items.length === FIRST || data === null) return null;
  return { host: host as HTMLElement, stage, panel, items, data };
}

export const itemId = (item: HTMLElement): string => item.getAttribute('data-pp-item') ?? '';

/** Libellé de chaque jalon en bouton ; `onPick` reçoit l'identifiant choisi. */
export function addSelectors({ items }: Parts, onPick: (id: string) => void): void {
  items.forEach((item) => {
    const name = item.querySelector(NAME);
    if (!name) return;
    const button = item.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = SELECT_CLASS;
    button.textContent = name.textContent;
    button.addEventListener('click', () => onPick(itemId(item)));
    name.replaceChildren(button);
  });
}

/** Remet les libellés en texte simple et vide le panneau. */
export function removeSelectors({ items, panel }: Parts): void {
  items.forEach((item) => {
    const name = item.querySelector(NAME);
    name?.replaceChildren(name.textContent ?? '');
  });
  panel.hidden = true;
  panel.replaceChildren();
}

/** Copie du jalon dans le panneau : les nœuds du `<li>`, le bouton redevenu texte. */
function fillPanel(panel: HTMLElement, item: HTMLElement): void {
  const copy = item.cloneNode(true) as HTMLElement;
  const name = copy.querySelector(NAME);
  name?.replaceChildren(name.textContent ?? '');
  panel.replaceChildren(...Array.from(copy.childNodes));
  panel.hidden = false;
}

/** Marque le jalon actif (un seul `aria-pressed="true"`) et met le panneau à jour. */
export function showActive({ items, panel }: Parts, id: string): void {
  items.forEach((item) => {
    const active = itemId(item) === id;
    item.querySelector('button')?.setAttribute('aria-pressed', String(active));
    if (active) fillPanel(panel, item);
  });
}
