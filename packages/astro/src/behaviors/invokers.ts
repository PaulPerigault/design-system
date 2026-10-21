/**
 * Repli des Invoker Commands (HTML : `commandfor`, `command`) et de `closedby="any"` pour les
 * navigateurs qui ne les connaissent pas. Ne fait rien quand le navigateur les gère : le balisage
 * de Dialog et Gallery reste la source de vérité, ce script ne fait que le rejouer.
 */

/** Sous-ensemble de `HTMLDialogElement` utilisé ici (injectable en test). */
export interface DialogLike {
  readonly open: boolean;
  showModal(): void;
  close(): void;
  requestClose?: () => void;
  getAttribute(name: string): string | null;
  getBoundingClientRect(): { left: number; right: number; top: number; bottom: number };
}

export interface Support {
  invokers: boolean;
  closedBy: boolean;
}

const isDialog = (value: unknown): value is DialogLike =>
  typeof value === 'object' && value !== null && 'showModal' in value && 'close' in value;

const hasClosest = (value: unknown): value is Pick<Element, 'closest'> =>
  typeof value === 'object' && value !== null && 'closest' in value;

/** Joue une commande sur un dialogue ; vrai si la commande est connue. */
export function runCommand(dialog: DialogLike, command: string | null): boolean {
  if (command === 'show-modal') {
    if (!dialog.open) dialog.showModal();
  } else if (command === 'close') {
    if (dialog.open) dialog.close();
  } else if (command === 'request-close') {
    if (dialog.open) (dialog.requestClose ?? dialog.close).call(dialog);
  } else {
    return false;
  }
  return true;
}

/** Clic sur un bouton d'invocation : la commande visée par `commandfor`. */
export function onInvoke(target: unknown, find: (id: string) => unknown): boolean {
  const button = hasClosest(target) ? target.closest('button[commandfor][command]') : null;
  const dialog = button ? find(button.getAttribute('commandfor') ?? '') : null;
  return isDialog(dialog) && runCommand(dialog, button?.getAttribute('command') ?? null);
}

/** Clic hors de la boîte d'un dialogue `closedby="any"` (le clic vise alors le dialogue). */
export function onLightDismiss(target: unknown, x: number, y: number): boolean {
  if (!isDialog(target) || !target.open || target.getAttribute('closedby') !== 'any') return false;
  const box = target.getBoundingClientRect();
  const inside = x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  if (!inside) target.close();
  return !inside;
}

/** Fonctions présentes nativement, lues sur les prototypes du navigateur. */
export const detect = (): Support => ({
  invokers: 'command' in HTMLButtonElement.prototype,
  closedBy: 'closedBy' in HTMLDialogElement.prototype,
});

/** Installe les replis manquants ; renvoie ce qui a été installé. */
export function install(doc: Document, support: Support = detect()): Support {
  const installed = { invokers: !support.invokers, closedBy: !support.closedBy };
  if (installed.invokers) {
    doc.addEventListener('click', (event) =>
      onInvoke(event.target, (id) => doc.getElementById(id)),
    );
  }
  if (installed.closedBy) {
    doc.addEventListener('click', (event) =>
      onLightDismiss(event.target, event.clientX, event.clientY),
    );
  }
  return installed;
}
