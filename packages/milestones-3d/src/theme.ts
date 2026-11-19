// Thème de la scène, lu dans les variables CSS résolues de la page.
//
// `getPropertyValue('--pp-color-accent')` rend le texte brut `light-dark(…)`, pas une couleur :
// une propriété personnalisée non enregistrée n'est pas calculée. On applique donc le jeton à la
// propriété `color` d'un élément sonde, posé sous la racine pour hériter de `color-scheme`, et on
// lit la `color` calculée. La sonde passe par le CSSOM (aucun attribut `style` dans le balisage :
// compatible avec une CSP sans `unsafe-inline`).
import { parseColor } from './color.ts';
import { FALLBACK_DURATION_MS, FALLBACK_EASING, THEME_TOKENS } from './constants.ts';
import { parseDuration, parseEasing } from './css-values.ts';
import { MilestonesError } from './error.ts';
import type { Theme, ThemeColor, ThemeColorName } from './types.ts';

/** Ce que `readTheme` demande à la page ; une sonde injectable remplace le DOM dans les tests. */
export interface ThemeProbe {
  /** Couleur calculée d'un jeton, ou `null` si le jeton n'est pas défini. */
  color(token: string): string | null;
  /** Texte brut d'une propriété personnalisée (vide si absente). */
  custom(name: string): string;
  dispose(): void;
}

/** Fabrique de sonde pour une racine de type `R` (un `Element` dans le navigateur). */
export type ThemeEnv<R = Element> = (root: R) => ThemeProbe;

export const domProbe: ThemeEnv = (root) => {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new MilestonesError('invalid-theme', 'document sans fenêtre');
  const element = document.createElement('span');
  element.style.setProperty('transition', 'none');
  root.append(element);
  const rootStyle = view.getComputedStyle(root);
  return {
    custom: (name) => rootStyle.getPropertyValue(name).trim(),
    color(token) {
      if (rootStyle.getPropertyValue(token).trim() === '') return null;
      element.style.setProperty('color', `var(${token})`);
      return view.getComputedStyle(element).color;
    },
    dispose: () => element.remove(),
  };
};

function colorOf(probe: ThemeProbe, name: ThemeColorName): ThemeColor {
  const token = THEME_TOKENS[name];
  const computed = probe.color(token);
  if (computed === null) throw new MilestonesError('invalid-theme', `${token} absent`);
  return parseColor(computed);
}

/**
 * Lit les jetons de la liste fermée `THEME_TOKENS` avec une sonde injectée. Une couleur absente ou
 * illisible lève `invalid-theme` ou `unsupported-color` (aucune couleur n'est inventée). Une durée
 * illisible vaut 0 ms, une courbe non reconnue est linéaire.
 */
export function readThemeWith<R>(root: R, env: ThemeEnv<R>): Theme {
  const probe = env(root);
  try {
    const color = (name: ThemeColorName): ThemeColor => colorOf(probe, name);
    return {
      colors: {
        bg: color('bg'),
        fg: color('fg'),
        accent: color('accent'),
        onAccent: color('onAccent'),
        line: color('line'),
        muted: color('muted'),
      },
      durationBase: parseDuration(probe.custom(THEME_TOKENS.durationBase)) ?? FALLBACK_DURATION_MS,
      durationFast: parseDuration(probe.custom(THEME_TOKENS.durationFast)) ?? FALLBACK_DURATION_MS,
      easing: parseEasing(probe.custom(THEME_TOKENS.easing)) ?? FALLBACK_EASING,
    };
  } finally {
    probe.dispose();
  }
}

/** Lit les jetons sous `root` (un élément du document) : voir `readThemeWith`. */
export const readTheme = (root: Element): Theme => readThemeWith(root, domProbe);
