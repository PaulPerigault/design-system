import type { Oklch } from '@paulperigault/tokens/color';

export type Theme = 'light' | 'dark';

/** Jetons neutres et accent d'un thème, lus dans `tokens.json` : rien n'est codé en dur ici. */
export interface ThemeBase {
  readonly accent: Oklch;
  readonly onAccent: Oklch;
  readonly bg: Oklch;
  readonly fg: Oklch;
  readonly line: Oklch;
}

export interface Palettes {
  readonly theme: Theme;
  readonly hue: number;
  readonly accent: Oklch;
  readonly onAccent: Oklch;
  /** 6 couleurs, l'accent en tête ; les n premières servent n séries. */
  readonly categorical: readonly Oklch[];
  /** 7 pas de clarté monotone vers l'accent. */
  readonly sequential: readonly Oklch[];
  /** 7 pas : accent, centre neutre (`--pp-color-line`), teinte opposée. */
  readonly diverging: readonly Oklch[];
}
