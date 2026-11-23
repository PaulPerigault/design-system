/** Requêtes communes des tests de comportement de Milestones3D. */
export const buttons = (host: Element): HTMLButtonElement[] =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('.pp-milestones__select'));
export const panel = (host: Element): Element => host.querySelector('[data-pp-panel]') as Element;
export const openDetails = (host: Element): (string | null)[] =>
  Array.from(host.querySelectorAll('[data-pp-detail]'))
    .filter((detail) => !detail.hasAttribute('hidden'))
    .map((detail) => detail.getAttribute('data-pp-detail'));
