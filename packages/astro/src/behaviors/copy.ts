/**
 * Bouton de copie de CodeBlock. Le bouton est masqué (`hidden`) dans le HTML : il n'est révélé
 * que si `navigator.clipboard` existe. Le résultat est annoncé dans le `role="status"` du bloc.
 */

export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

/** Délai avant d'effacer l'annonce, pour qu'une nouvelle copie soit annoncée à nouveau. */
export const ANNOUNCE_MS = 3000;

const TRAILING_BREAK = /\r?\n$/;

/** Texte à copier : le contenu du `<pre>`, sans saut de ligne final. */
export const textOf = (pre: { textContent: string | null } | null): string =>
  (pre?.textContent ?? '').replace(TRAILING_BREAK, '');

export type Schedule = (task: () => void, ms: number) => unknown;

/** Copie le bloc du bouton puis annonce `data-copied`. Sans effet si la copie est refusée. */
export async function copyBlock(
  button: HTMLElement,
  clipboard: ClipboardLike,
  schedule: Schedule = setTimeout,
): Promise<boolean> {
  const figure = button.closest('figure');
  const status = figure?.querySelector('[role="status"]');
  try {
    await clipboard.writeText(textOf(figure?.querySelector('pre') ?? null));
  } catch {
    return false;
  }
  if (status) {
    status.textContent = button.dataset.copied ?? '';
    schedule(() => (status.textContent = ''), ANNOUNCE_MS);
  }
  return true;
}

/** Révèle chaque bouton `[data-copy]` de `root` et le relie ; renvoie le nombre de boutons. */
export function install(
  root: ParentNode,
  clipboard: ClipboardLike | null = navigator.clipboard ?? null,
  schedule: Schedule = setTimeout,
): number {
  if (!clipboard) return 0;
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('button[data-copy]'));
  for (const button of buttons) {
    button.hidden = false;
    button.addEventListener('click', () => void copyBlock(button, clipboard, schedule));
  }
  return buttons.length;
}
