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

/** Commandes gérées : chacune est sans effet si le dialogue est déjà dans l'état visé. */
const COMMANDS: Readonly<Record<string, (dialog: DialogLike) => void>> = {
  'show-modal': (dialog) => {
    if (!dialog.open) dialog.showModal();
  },
  close: (dialog) => {
    if (dialog.open) dialog.close();
  },
  'request-close': (dialog) => {
    if (dialog.open) (dialog.requestClose ?? dialog.close).call(dialog);
  },
};

/** Joue une commande sur un dialogue ; vrai si la commande est connue (casse ignorée). */
export function runCommand(dialog: DialogLike, command: string | null): boolean {
  const name = command?.toLowerCase() ?? '';
  const run = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  run?.(dialog);
  return run !== undefined;
}

type Invoker = Pick<HTMLElement, 'getAttribute'> & { focus?: () => void };

/**
 * Clic sur un bouton d'invocation : la commande visée par `commandfor`. Le bouton reçoit le
 * focus avant l'ouverture (Safari ne le donne pas au clic) : le navigateur le lui rend à la
 * fermeture, comme avec l'API native.
 */
export function onInvoke(target: unknown, find: (id: string) => unknown): boolean {
  const button = hasClosest(target)
    ? (target.closest('button[commandfor][command]') as Invoker | null)
    : null;
  const dialog = button ? find(button.getAttribute('commandfor') ?? '') : null;
  if (!button || !isDialog(dialog)) return false;
  button.focus?.();
  return runCommand(dialog, button.getAttribute('command'));
}

/** Point d'appui ou de clic, et sa cible. */
export interface PointerAt {
  target: unknown;
  x: number;
  y: number;
}

const outside = (dialog: DialogLike, { x, y }: PointerAt): boolean => {
  const box = dialog.getBoundingClientRect();
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
};

/**
 * Clic hors de la boîte d'un dialogue `closedby="any"` : l'appui et le relâché doivent tous deux
 * viser le fond (un glisser commencé dans la boîte ne ferme pas), comme le comportement natif.
 */
export function onLightDismiss(click: PointerAt, pressed: PointerAt | null): boolean {
  const dialog = click.target;
  if (!isDialog(dialog) || !dialog.open || dialog.getAttribute('closedby') !== 'any') return false;
  const dismiss = pressed?.target === dialog && outside(dialog, pressed) && outside(dialog, click);
  if (dismiss) dialog.close();
  return dismiss;
}

/** Fonctions présentes nativement, lues sur les prototypes du navigateur. */
export const detect = (): Support => ({
  invokers: 'command' in HTMLButtonElement.prototype,
  closedBy: 'closedBy' in HTMLDialogElement.prototype,
});

const pointerOf = (event: MouseEvent): PointerAt => ({
  target: event.target,
  x: event.clientX,
  y: event.clientY,
});

/** Installe les replis manquants ; renvoie ce qui a été installé. */
export function install(doc: Document, support: Support = detect()): Support {
  const installed = { invokers: !support.invokers, closedBy: !support.closedBy };
  if (installed.invokers) {
    doc.addEventListener('click', (event) => {
      // Commande jouée : pas de soumission de formulaire en plus (bouton `type="submit"`).
      if (onInvoke(event.target, (id) => doc.getElementById(id))) event.preventDefault();
    });
  }
  if (installed.closedBy) {
    let pressed: PointerAt | null = null;
    doc.addEventListener('pointerdown', (event) => (pressed = pointerOf(event)));
    doc.addEventListener('click', (event) => onLightDismiss(pointerOf(event), pressed));
  }
  return installed;
}
