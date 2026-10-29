/**
 * Applique les entrées validées (teinte d'accent, pile de police) au modèle d'émission : seules
 * les variables que le modèle porte déjà sont remplacées, la forme des sorties ne change pas.
 */
import { parseOklch, toHex } from '../../src/lib/color.ts';
import type { Oklch } from '../../src/lib/color.ts';
import type { BuildInput } from '../../src/customize/input.ts';
import { deriveOverrides, THEME_NAMES } from '../../src/customize/derive-overrides.ts';
import type { Result } from '../../src/customize/result.ts';
import { fail, ok } from '../../src/customize/result.ts';
import type { TokenMap } from '../../src/palette/domain/tokens.ts';
import type { RoleBase, ThemeSource } from '../../src/customize/derive-roles.ts';
import type { ThemeBase } from '../../src/palette/domain/types.ts';
import type { Model, ThemeEntry } from './types.ts';

export const FONT_SANS_TOKEN = '--pp-font-family-sans';

const NEUTRALS = ['--pp-color-bg', '--pp-color-fg', '--pp-color-line'] as const;

const colorOf = (entries: ThemeEntry[], name: string): Oklch | undefined => {
  const entry = entries.find((candidate) => candidate.name === name);
  return entry === undefined ? undefined : parseOklch(entry.oklch);
};

function paletteBase(entries: ThemeEntry[]): ThemeBase | undefined {
  const accent = colorOf(entries, '--pp-color-accent');
  const onAccent = colorOf(entries, '--pp-color-on-accent');
  const [bg, fg, line] = NEUTRALS.map((name) => colorOf(entries, name));
  return accent && onAccent && bg && fg && line ? { accent, onAccent, bg, fg, line } : undefined;
}

function roleBase(entries: ThemeEntry[]): RoleBase | undefined {
  const focus = colorOf(entries, '--pp-color-focus');
  const running = colorOf(entries, '--pp-color-status-running');
  const surface = colorOf(entries, '--pp-color-surface');
  return focus && running && surface ? { focus, running, surface } : undefined;
}

function baseOf(entries: ThemeEntry[] | undefined): ThemeSource | undefined {
  if (entries === undefined) return undefined;
  const palette = paletteBase(entries);
  const roles = roleBase(entries);
  return palette && roles ? { ...palette, ...roles } : undefined;
}

function replaceColors(entries: ThemeEntry[], tokens: TokenMap): ThemeEntry[] {
  return entries.map((entry) => {
    const value = tokens[entry.name];
    if (value === undefined) return entry;
    const color = parseOklch(value);
    return { ...entry, oklch: value, hex: toHex(color) };
  });
}

function withHue(model: Model, hue: number): Result<Model> {
  const [light, dark] = THEME_NAMES.map((theme) => baseOf(model.themes[theme]));
  if (light === undefined || dark === undefined) {
    return fail(
      'build.derivation-failed',
      'Sources : accent, texte sur accent, neutres, focus et statut requis.',
    );
  }
  const derived = deriveOverrides(hue, { light, dark });
  if (!derived.ok) return derived;
  const themes: Record<string, ThemeEntry[]> = { ...model.themes };
  for (const theme of THEME_NAMES) {
    themes[theme] = replaceColors(model.themes[theme] ?? [], derived.value[theme]);
  }
  return ok({ ...model, themes });
}

const withStack = (model: Model, stack: string): Model => ({
  ...model,
  base: model.base.map((token) =>
    token.name === FONT_SANS_TOKEN ? { ...token, css: stack } : token,
  ),
});

export function applyInput(model: Model, input: BuildInput): Result<Model> {
  const hued = input.accentHue === undefined ? ok(model) : withHue(model, input.accentHue);
  if (!hued.ok || input.fontStack === undefined) return hued;
  return ok(withStack(hued.value, input.fontStack));
}
