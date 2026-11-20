// Suit le thème : `data-theme` sur `:root` (forçage clair ou sombre) et `prefers-color-scheme`.
// Un changement relit les jetons et rappelle `apply` (un seul rendu à la demande suit).
import type { Bag } from './bag.ts';
import type { Env } from './env.ts';
import type { Theme } from './types.ts';

const DARK = '(prefers-color-scheme: dark)';

export interface ThemeWatch {
  readonly env: Env;
  readonly bag: Bag;
  /** `:root`, où vit `data-theme`. */
  readonly html: object;
  /** Élément sous lequel les jetons sont lus. */
  readonly root: object;
  apply(theme: Theme): void;
}

export function watchTheme({ env, bag, html, root, apply }: ThemeWatch): void {
  const refresh = (): void => {
    try {
      apply(env.readTheme(root));
    } catch {
      // Jetons illisibles à cet instant : le thème en cours reste affiché, rien de plus visible.
    }
  };
  const mutations = new env.MutationObserver(refresh);
  mutations.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  bag.add(() => mutations.disconnect());
  bag.listen(env.matchMedia(DARK), 'change', refresh);
}
