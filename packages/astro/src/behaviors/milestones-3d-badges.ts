/**
 * Badges de la scène : une image HTML par jalon obtenu, de face et intacte, posée sur sa médaille
 * d'après `project()` (ADR-0014). Transformation CSSOM : translation et échelle uniforme seulement
 * (jamais l'attribut `style`, CSP). `aria-hidden` et `alt` vide : la liste et le panneau portent
 * déjà le nom et l'image. `pointer-events: none` (CSS) : le survol, le clic et le toucher
 * atteignent le canvas, donc la même cible logique que la médaille. L'image ne se charge qu'à la
 * première visibilité de sa médaille (aucune donnée mobile pour un badge jamais montré).
 */
import { HIDDEN, badgeBox, badgeTransform, known } from './milestones-3d-badge-box';
import type { Mark } from './milestones-3d-types';
import { itemId, type Parts } from './milestones-3d-view';

export interface Badges {
  /** Pose les badges d'après les positions de la dernière image dessinée. */
  update(marks: readonly Mark[]): void;
  remove(): void;
}

const SOURCE = 'img.pp-milestones__badge';

interface Sprite {
  image: HTMLImageElement;
  src: string;
  requested: boolean;
}

function spriteFor(item: HTMLElement, onLoad: () => void): Sprite | null {
  const source = item.querySelector<HTMLImageElement>(SOURCE);
  const src = source?.getAttribute('src') ?? '';
  if (src === '' || item.getAttribute('data-status') !== 'achieved') return null;
  const image = item.ownerDocument.createElement('img');
  image.className = 'pp-milestones__sprite';
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.setAttribute('data-hidden', '');
  image.setAttribute('decoding', 'async');
  image.draggable = false;
  image.tabIndex = -1;
  image.addEventListener('load', onLoad);
  return { image, src, requested: false };
}

export function addBadges(parts: Parts, onLoad: () => void): Badges {
  const doc = parts.host.ownerDocument;
  const layer = doc.createElement('div');
  layer.className = 'pp-milestones__sprites';
  layer.setAttribute('aria-hidden', 'true');
  const sprites = new Map<string, Sprite>();
  parts.items.forEach((item) => {
    const sprite = spriteFor(item, onLoad);
    if (sprite) sprites.set(itemId(item), sprite);
  });
  layer.append(...Array.from(sprites.values(), ({ image }) => image));
  parts.stage.append(layer);
  const place = (sprite: Sprite, mark: Mark | undefined): void => {
    const { image } = sprite;
    const natural = { width: image.naturalWidth, height: image.naturalHeight };
    const area = { width: parts.stage.clientWidth, height: parts.stage.clientHeight };
    const box = mark ? badgeBox(mark, natural, area) : HIDDEN;
    if (mark?.visible && !sprite.requested) {
      sprite.requested = true;
      image.src = sprite.src;
    }
    image.toggleAttribute('data-hidden', !box.visible);
    if (!box.visible || !known(natural)) return;
    image.style.transform = badgeTransform(box);
    image.style.zIndex = String(box.depth);
  };
  return {
    update(marks) {
      const byId = new Map(marks.map((mark) => [mark.id, mark]));
      sprites.forEach((sprite, id) => place(sprite, byId.get(id)));
    },
    remove() {
      layer.remove();
    },
  };
}
