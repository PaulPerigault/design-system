/**
 * Étiquettes de la scène en HTML superposé : code et date courte par jalon, titre pour l'actif.
 * `aria-hidden` : le sens est dans la liste et le panneau. Positionnées par le CSSOM (`transform`,
 * jamais l'attribut `style`, CSP) d'après `project()` ; la mise en page n'est lue qu'à
 * `measure()`, pas à chaque image.
 */
import { placeLabels, type Size } from './milestones-3d-place';
import type { Mark } from './milestones-3d-types';
import { itemId, type Parts } from './milestones-3d-view';

export interface Labels {
  /** Relit les tailles (à appeler quand l'actif change : son titre s'affiche). */
  measure(): void;
  setActive(id: string | null): void;
  /** Pose les étiquettes d'après les positions de la dernière image dessinée. */
  update(marks: readonly Mark[]): void;
  remove(): void;
}

const NONE = 0;
const text = (item: HTMLElement, selector: string): string =>
  item.querySelector(selector)?.textContent?.trim() ?? '';

function labelFor(item: HTMLElement): HTMLElement {
  const doc = item.ownerDocument;
  const label = doc.createElement('span');
  label.className = 'pp-milestones__label';
  label.setAttribute('data-status', item.getAttribute('data-status') ?? '');
  const goal = item.hasAttribute('data-pp-goal');
  const code = text(item, '[data-pp-code]') || (goal ? text(item, '.pp-milestones__status') : '');
  const short = item.querySelector('time')?.getAttribute('data-pp-short') ?? '';
  const parts: [string, string][] = [
    ['code', code],
    ['date', short],
    ['title', text(item, '[data-pp-name]')],
  ];
  parts.forEach(([name, value]) => {
    const part = doc.createElement('span');
    part.className = `pp-milestones__label-${name}`;
    part.textContent = value;
    label.append(part);
  });
  label.toggleAttribute('data-bare', code === '' && short === '');
  // Masquée jusqu'à sa première position : jamais posée en (0, 0) puis déplacée (décalage).
  label.setAttribute('data-hidden', '');
  return label;
}

/** Mesure chaque étiquette (pixels CSS) ; une étiquette non mesurable vaut zéro. */
function measureAll(labels: ReadonlyMap<string, HTMLElement>, sizes: Map<string, Size>): void {
  labels.forEach((label, id) =>
    sizes.set(id, {
      width: Number(label.offsetWidth) || NONE,
      height: Number(label.offsetHeight) || NONE,
    }),
  );
}

export function addLabels(parts: Parts): Labels {
  const layer = parts.host.ownerDocument.createElement('div');
  layer.className = 'pp-milestones__labels';
  layer.setAttribute('aria-hidden', 'true');
  const labels = new Map(parts.items.map((item) => [itemId(item), labelFor(item)]));
  layer.append(...labels.values());
  parts.stage.append(layer);
  const sizes = new Map<string, Size>();
  let active: string | null = null;
  let last: readonly Mark[] = [];
  return {
    measure: () => measureAll(labels, sizes),
    setActive(id) {
      active = id;
      labels.forEach((label, key) => label.toggleAttribute('data-active', key === id));
      this.measure();
      // L'actif change de taille (titre) : on le recentre avant la peinture, pas à l'image suivante.
      if (last.length > NONE) this.update(last);
    },
    update(marks) {
      last = marks;
      const area = { width: parts.stage.clientWidth, height: parts.stage.clientHeight };
      if (sizes.size === NONE) this.measure();
      const placed = placeLabels(marks, sizes, area, active);
      labels.forEach((label, id) => {
        const at = placed.get(id);
        const visible = at?.visible ?? false;
        label.toggleAttribute('data-hidden', !visible);
        if (at && visible) label.style.transform = `translate(${at.left}px, ${at.top}px)`;
      });
    },
    remove() {
      layer.remove();
    },
  };
}
