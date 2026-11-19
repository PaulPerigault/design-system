// Le thème sous la forme que reçoit le `.wasm` : 30 nombres (voir `pp-milestones::theme`).
import { COLOR_ORDER } from './constants.ts';
import type { Theme, ThemeColor } from './types.ts';

/** Étiquettes d'espace du tableau : 0 sRGB, 1 OKLCH. */
const SPACE_SRGB = 0;
const SPACE_OKLCH = 1;

const color = (value: ThemeColor): number[] =>
  value.space === 'srgb'
    ? [SPACE_SRGB, value.r, value.g, value.b]
    : [SPACE_OKLCH, value.l, value.c, value.h];

/** Six couleurs (espace puis trois composantes), deux durées, quatre points de contrôle. */
export const themeToArray = (theme: Theme): Float32Array =>
  Float32Array.from([
    ...COLOR_ORDER.flatMap((name) => color(theme.colors[name])),
    theme.durationBase,
    theme.durationFast,
    ...theme.easing,
  ]);
