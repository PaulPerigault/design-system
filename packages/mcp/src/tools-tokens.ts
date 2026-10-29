// Outils « jetons » : get_tokens (valeurs par rôle et par thème, contraste des paires connues)
// et check_contrast (WCAG 2 normatif, APCA informatif).
import { contrastReport, pairReport, resolveColor } from './contrast-pair.ts';
import type { Theme } from './contrast-pair.ts';
import type { Data, Tokens } from './data.ts';
import { defineTool, schemas, ToolError } from './schemas.ts';
import type { ToolDefinition } from './schemas.ts';

const PREFIX = '--pp-';
const THEMES: Theme[] = ['light', 'dark'];
const DEFAULT_THEME: Theme = 'light';

/** `--pp-color-status-passed` → `color` ; `--pp-space-s` → `space`. */
export const roleOf = (name: string): string => name.slice(PREFIX.length).split('-')[0] ?? '';

/** Rôles connus, tous thèmes et jetons de base confondus. */
export function rolesOf(tokens: Tokens): string[] {
  const names = [
    ...THEMES.flatMap((t) => Object.keys(tokens.themes[t])),
    ...Object.keys(tokens.base),
  ];
  return [...new Set(names.map(roleOf))].sort();
}

function themeView(tokens: Tokens, theme: Theme, keep: (name: string) => boolean) {
  const values = tokens.themes[theme];
  return {
    tokens: Object.entries(values)
      .filter(([name]) => keep(name))
      .map(([name, { oklch, hex }]) => ({ name, role: roleOf(name), oklch, hex })),
    pairs: tokens.pairs
      .filter((pair) => keep(pair.fg) || keep(pair.bg))
      .map((pair) => pairReport(pair, values))
      .filter(Boolean),
  };
}

export function getTokens(
  tokens: Tokens,
  { role, theme }: { role?: string | undefined; theme?: Theme | undefined } = {},
) {
  const roles = rolesOf(tokens);
  if (role !== undefined && !roles.includes(role)) {
    throw new ToolError(`rôle inconnu « ${role} » ; rôles : ${roles.join(', ')}.`);
  }
  const keep = (name: string): boolean => role === undefined || roleOf(name) === role;
  const themes = theme === undefined ? THEMES : [theme];
  return {
    roles,
    themes: Object.fromEntries(themes.map((t) => [t, themeView(tokens, t, keep)])),
    base: Object.entries(tokens.base)
      .filter(([name]) => keep(name))
      .map(([name, value]) => ({ name, role: roleOf(name), value })),
  };
}

export function checkContrast(
  tokens: Tokens,
  {
    foreground,
    background,
    theme = DEFAULT_THEME,
  }: { foreground: string; background: string; theme?: Theme | undefined },
) {
  const context = { tokens, theme };
  return contrastReport(resolveColor(foreground, context), resolveColor(background, context));
}

export function tokenTools({ tokens }: Pick<Data, 'tokens'>): ToolDefinition[] {
  return [
    defineTool({
      name: 'get_tokens',
      title: 'Jetons --pp-*',
      description:
        'Jetons --pp-* par rôle (color, space, font, size…) et par thème (light, dark) : ' +
        'valeur OKLCH et hexadécimal sRGB rendu, jetons de base, et contraste WCAG 2 calculé ' +
        'pour les paires avant-plan/arrière-plan connues.',
      schema: schemas.get_tokens,
      run: (input) => getTokens(tokens, input),
    }),
    defineTool({
      name: 'check_contrast',
      title: 'Vérifier un contraste',
      description:
        'Contraste entre deux couleurs (#rgb, #rrggbb, oklch(…) ou jeton --pp-… résolu dans ' +
        'le thème, light par défaut) : ratio WCAG 2, niveaux AA/AAA en texte normal et grand ' +
        'texte, et Lc APCA à titre informatif.',
      schema: schemas.check_contrast,
      run: (input) => checkContrast(tokens, input),
    }),
  ];
}
