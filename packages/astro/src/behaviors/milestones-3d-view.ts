/**
 * Vue de Milestones3D : lecture du balisage serveur, état actif, panneau de détail. Aucun rendu 3D
 * ici. La liste reste la source de vérité ; le panneau affiche le détail rendu par le serveur
 * (un `<article hidden>` par étape), sans l'annoncer : aucune région `aria-live`.
 */

export interface Parts {
  host: HTMLElement;
  track: HTMLElement;
  stage: HTMLElement;
  list: HTMLElement;
  panel: HTMLElement;
  /** Une entrée par étape (jalons triés puis objectif), dans l'ordre de la liste. */
  items: HTMLElement[];
  /** Données du bloc JSON : validées plus tard par le paquet 3D, jamais ici. */
  data: unknown;
}

const NONE = 0;
const ITEM = 'data-pp-item';
const STEPS_VAR = '--milestones-steps';

const parse = (host: Element): unknown => {
  try {
    return JSON.parse(host.querySelector('[data-pp-data]')?.textContent ?? '');
  } catch {
    return null;
  }
};

/** Éléments du composant, ou null si le balisage ne correspond pas. */
export function collect(host: Element): Parts | null {
  const find = (name: string): HTMLElement | null => host.querySelector<HTMLElement>(name);
  const [track, stage, list, panel] = ['track', 'stage', 'list', 'panel'].map((name) =>
    find(`[data-pp-${name}]`),
  );
  const items = Array.from(host.querySelectorAll<HTMLElement>(`[${ITEM}]`));
  const data = parse(host);
  if (!track || !stage || !list || !panel || items.length === NONE || data === null) return null;
  return { host: host as HTMLElement, track, stage, list, panel, items, data };
}

/** Lève la réservation d'empreinte : la liste reprend sa place (repli, un seul décalage). */
export const releaseReserve = (host: Element): void => host.removeAttribute('data-reserve');

export const itemId = (item: HTMLElement): string => item.getAttribute(ITEM) ?? '';

export const ids = (parts: Parts): string[] => parts.items.map(itemId);

/** Hauteur de la piste : le CSS la déduit du nombre d'étapes (CSSOM, jamais l'attribut `style`). */
export function setTrackSteps({ track }: Parts, count: number): void {
  track.style.setProperty(STEPS_VAR, String(count));
}

export function clearTrackSteps({ track }: Parts): void {
  track.style.removeProperty(STEPS_VAR);
}

/** Marque l'étape active : `aria-current="step"` sur son bouton, `data-active` sur son élément. */
export function markActive({ items }: Parts, index: number): void {
  items.forEach((item, at) => {
    const on = at === index;
    item.toggleAttribute('data-active', on);
    const button = item.querySelector('button');
    if (on) button?.setAttribute('aria-current', 'step');
    else button?.removeAttribute('aria-current');
  });
}

/** Affiche le détail de l'étape (ou le masque : `null`) ; le panneau garde sa place. */
export function showDetail({ panel }: Parts, id: string | null): void {
  panel.hidden = false;
  panel.setAttribute('data-near', String(id !== null));
  panel.querySelectorAll<HTMLElement>('[data-pp-detail]').forEach((detail) => {
    detail.hidden = detail.getAttribute('data-pp-detail') !== id;
  });
}

/** Remet le panneau à l'état du serveur : masqué, vide de toute sélection. */
export function resetDetail({ panel }: Parts): void {
  panel.hidden = true;
  panel.removeAttribute('data-near');
  panel.querySelectorAll<HTMLElement>('[data-pp-detail]').forEach((detail) => {
    detail.hidden = true;
  });
}
