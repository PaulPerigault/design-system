import { formatOklch } from '../../lib/color.ts';
import type { Palettes } from './types.ts';

export type TokenMap = Readonly<Record<string, string>>;

/** Variables CSS d'un thème : accent, texte sur accent, puis les trois palettes numérotées de 1. */
export function paletteTokens(palettes: Palettes): TokenMap {
  const entries: [string, string][] = [
    ['--pp-color-accent', formatOklch(palettes.accent)],
    ['--pp-color-on-accent', formatOklch(palettes.onAccent)],
  ];
  const ramp = (prefix: string, colors: Palettes['categorical']): void => {
    for (const [index, color] of colors.entries()) {
      entries.push([`--pp-chart-${prefix}${index + 1}`, formatOklch(color)]);
    }
  };
  ramp('', palettes.categorical);
  ramp('seq-', palettes.sequential);
  ramp('div-', palettes.diverging);
  return Object.fromEntries(entries);
}

/** Valeurs `light-dark(clair, sombre)` : une seule déclaration par variable. */
export function lightDarkTokens(light: Palettes, dark: Palettes): TokenMap {
  const sombre = paletteTokens(dark);
  return Object.fromEntries(
    Object.entries(paletteTokens(light)).map(([name, value]) => [
      name,
      `light-dark(${value}, ${sombre[name] ?? value})`,
    ]),
  );
}
