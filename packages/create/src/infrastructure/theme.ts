// Adaptateur de dérivation du thème : appelle le code de `@paulperigault/tokens` (build de la
// teinte d'accent et de la pile de police). En source, le paquet voisin du dépôt ; dans `dist/`,
// `scripts/vendor-tokens.ts` copie sa version compilée dans `dist/vendor/tokens/` et réécrit ces
// trois spécificateurs : aucune dépendance d'exécution n'est ajoutée à `create`.
import { parseOklch } from '@paulperigault/tokens/color';
import type { Oklch } from '@paulperigault/tokens/color';
import { deriveOverrides, parseBuildInput } from '@paulperigault/tokens/customize';
import defaults from '@paulperigault/tokens/tokens.json' with { type: 'json' };
import type { ThemeBuilder } from '../application/ports.ts';
import { themeCss } from '../domain/theme-css.ts';
import type { ThemeColors } from '../domain/theme-css.ts';

type Theme = 'light' | 'dark';

const TOKENS = {
  accent: '--pp-color-accent',
  onAccent: '--pp-color-on-accent',
  bg: '--pp-color-bg',
  fg: '--pp-color-fg',
  line: '--pp-color-line',
  focus: '--pp-color-focus',
  running: '--pp-color-status-running',
  surface: '--pp-color-surface',
} as const;

const entriesOf = (theme: Theme): Readonly<Record<string, { oklch: string }>> =>
  defaults.themes[theme];

const colorOf = (theme: Theme, name: string): Oklch => {
  const entry = entriesOf(theme)[name];
  if (entry === undefined) throw new Error(`tokens.json : ${name} absent du thème ${theme}`);
  return parseOklch(entry.oklch);
};

const sourceOf = (theme: Theme) => ({
  accent: colorOf(theme, TOKENS.accent),
  onAccent: colorOf(theme, TOKENS.onAccent),
  bg: colorOf(theme, TOKENS.bg),
  fg: colorOf(theme, TOKENS.fg),
  line: colorOf(theme, TOKENS.line),
  focus: colorOf(theme, TOKENS.focus),
  running: colorOf(theme, TOKENS.running),
  surface: colorOf(theme, TOKENS.surface),
});

/** Seules les variables que `tokens.css` porte déjà sont surchargées (comme le build). */
function known(theme: Theme, tokens: Readonly<Record<string, string>>): Record<string, string> {
  const present = entriesOf(theme);
  return Object.fromEntries(Object.entries(tokens).filter(([name]) => name in present));
}

export const buildTheme: ThemeBuilder = ({ accentHue, fontStack }) => {
  const input = parseBuildInput({
    ...(accentHue === undefined ? {} : { accentHue }),
    ...(fontStack === undefined ? {} : { fontStack }),
  });
  if (!input.ok) return { ok: false, ...input.error };
  let colors: ThemeColors | undefined;
  if (input.value.accentHue !== undefined) {
    const derived = deriveOverrides(input.value.accentHue, {
      light: sourceOf('light'),
      dark: sourceOf('dark'),
    });
    if (!derived.ok) return { ok: false, ...derived.error };
    colors = {
      light: known('light', derived.value.light),
      dark: known('dark', derived.value.dark),
    };
  }
  return { ok: true, css: themeCss({ colors, fontStack: input.value.fontStack }) };
};
