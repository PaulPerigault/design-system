/**
 * Clavier de Milestones3D, écouté sur la section : flèches gauche et droite (précédent, suivant),
 * Début et Fin (première, dernière étape). Les touches gérées ne défilent pas la page à côté du
 * déplacement de la caméra ; toutes les autres (Tab, flèches haut et bas, Espace, Page) gardent
 * leur effet natif : le focus n'est jamais piégé et le défilement reste celui du navigateur.
 */
import type { Pilot } from './milestones-3d-pilot';

const HANDLED = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
const FAR = Number.MAX_SAFE_INTEGER;

interface KeyLike {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  preventDefault(): void;
}

/** Déplacement demandé par la touche, dans le sens de lecture (`dir`), ou null. */
export function stepFor(key: string, rtl: boolean): number | null {
  const sign = rtl ? -1 : 1;
  const moves: Record<string, number> = {
    ArrowLeft: -sign,
    ArrowRight: sign,
    Home: -FAR,
    End: FAR,
  };
  return moves[key] ?? null;
}

const isPlain = (key: KeyLike): boolean =>
  !(key.altKey || key.ctrlKey || key.metaKey || key.shiftKey);

const isRtl = (host: HTMLElement): boolean =>
  host.ownerDocument.defaultView?.getComputedStyle?.(host)?.direction === 'rtl';

/** Branche le clavier ; rend la fonction qui retire l'écoute. */
export function addKeys(host: HTMLElement, pilot: Pilot): () => void {
  const onKey = (event: Event): void => {
    const key = event as unknown as KeyLike;
    if (!isPlain(key) || !HANDLED.includes(key.key)) return;
    const delta = stepFor(key.key, isRtl(host));
    if (delta === null) return;
    key.preventDefault();
    pilot.move(delta);
  };
  host.addEventListener('keydown', onKey);
  return () => host.removeEventListener('keydown', onKey);
}
