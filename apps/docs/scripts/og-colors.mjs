import tokens from '@paulperigault/tokens/tokens.json' with { type: 'json' };

/**
 * Couleurs de l'image Open Graph : thème clair de la direction Encre, lu dans les tokens
 * générés (`--pp-color-*`, valeur hex sRGB). Aucune couleur n'est écrite ici.
 */

export const OG_THEME = 'light';
const ROLES = { bg: '--pp-color-bg', fg: '--pp-color-fg', muted: '--pp-color-muted' };
const ACCENT_ROLE = '--pp-color-accent';

/** Hex d'un rôle ; échoue si le token manque (pas de repli silencieux). */
function hexOf(theme, name) {
  const hex = theme?.[name]?.hex;
  if (typeof hex !== 'string') throw new Error(`Token ${name} introuvable dans le thème Encre.`);
  return hex;
}

/** `{ bg, fg, muted, accent }` pour un thème de `tokens.json`. */
export function colorsOf(source = tokens, themeName = OG_THEME) {
  const theme = source.themes?.[themeName];
  const colors = Object.fromEntries(
    Object.entries(ROLES).map(([key, name]) => [key, hexOf(theme, name)]),
  );
  return { ...colors, accent: hexOf(theme, ACCENT_ROLE) };
}
