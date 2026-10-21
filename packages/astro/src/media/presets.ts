import tokens from '@paulperigault/tokens/tokens.json';
import type { Breakpoint, MediaKind, MediaLayout, Ratio } from './types';

/** Valeurs `base` de `tokens.json` (nom `--pp-*` → valeur CSS). */
export type BaseTokens = Readonly<Record<string, string>>;

/** Taille de police racine par défaut des navigateurs (convention), pour convertir rem → px. */
export const ROOT_FONT_PX = 16;
/** Densité d'un écran haute résolution (2 pixels physiques par pixel CSS). */
const HIGH_DENSITY = 2;
/** Densités servies : écran standard et écran haute résolution. */
export const DENSITIES = [1, HIGH_DENSITY] as const;
/** Une colonne sur deux, puis une sur trois, de la largeur de page. */
const HALF = 2;
const THIRD = 3;

/** Formats modernes servis en `<source>`, du plus compact au plus répandu. */
export const FORMATS = ['avif', 'webp'] as const;

/**
 * Qualité d'encodage par nature d'image (préférence, non prouvée) : une photo tolère la
 * compression ; une capture garde un texte net ; une illustration a des aplats.
 */
const QUALITY: Readonly<Record<MediaKind, number>> = { photo: 70, capture: 90, illustration: 80 };

const BASE: BaseTokens = tokens.base;
const REM = /^(\d+(?:\.\d+)?)rem$/;

const read = (base: BaseTokens, name: string): string => {
  const value = Object.hasOwn(base, name) ? base[name] : undefined;
  if (value === undefined) throw new Error(`Token manquant dans tokens.json : ${name}`);
  return value;
};

/** Valeur en rem d'un token ; lève s'il manque ou s'il n'est pas exprimé en rem. */
export function remOf(name: string, base: BaseTokens = BASE): number {
  const value = read(base, name);
  const amount = REM.exec(value)?.[1];
  if (amount === undefined) throw new Error(`Token ${name} attendu en rem, reçu : ${value}`);
  return Number(amount);
}

/** Largeur de référence (rem) de chaque emplacement, et seuil au-delà duquel elle est fixe. */
interface Reference {
  width: number;
  /** Largeur de fenêtre (rem) à partir de laquelle l'image cesse d'occuper `100vw`. */
  from?: number;
}

const pageRem = (base: BaseTokens): number => remOf('--pp-size-page', base);
const measureRem = (base: BaseTokens): number => remOf('--pp-size-measure', base);

/** Lecture paresseuse : un emplacement ne lit que les tokens dont il dépend. */
const REFERENCES: Readonly<Record<MediaLayout, (base: BaseTokens) => Reference>> = {
  page: (base) => ({ width: pageRem(base), from: pageRem(base) }),
  measure: (base) => ({ width: measureRem(base), from: measureRem(base) }),
  half: (base) => ({ width: pageRem(base) / HALF, from: pageRem(base) }),
  third: (base) => ({ width: pageRem(base) / THIRD, from: pageRem(base) }),
  avatar: (base) => ({ width: remOf('--pp-space-3xl', base) }),
};

const reference = (layout: MediaLayout, base: BaseTokens): Reference => REFERENCES[layout](base);

/** Attribut `sizes` de l'emplacement, construit depuis les tokens. */
export function sizesFor(layout: MediaLayout, base: BaseTokens = BASE): string {
  const { width, from } = reference(layout, base);
  return from === undefined ? `${width}rem` : `(min-width: ${from}rem) ${width}rem, 100vw`;
}

const px = (rem: number): number => Math.round(rem * ROOT_FONT_PX);

/**
 * Largeurs à générer (px) : chaque densité × largeur de référence, plus × mesure pour les
 * emplacements fluides (pleine largeur sous la mesure). Entières, triées, uniques, plafonnées à
 * la source ; au pire `[sourceWidth]`.
 */
export function widthsFor(
  layout: MediaLayout,
  sourceWidth: number,
  base: BaseTokens = BASE,
): number[] {
  if (!Number.isInteger(sourceWidth) || sourceWidth < 1) {
    throw new RangeError(`Largeur source invalide : ${sourceWidth}`);
  }
  const { width, from } = reference(layout, base);
  const widths = from === undefined ? [width] : [width, measureRem(base)];
  const candidates = widths.flatMap((rem) => DENSITIES.map((density) => px(rem * density)));
  const kept = [...new Set(candidates)].filter((w) => w <= sourceWidth).sort((a, b) => a - b);
  return kept.length > 0 ? kept : [sourceWidth];
}

/** Qualité d'encodage (0–100) selon la nature de l'image. */
export const qualityFor = (kind: MediaKind): number => QUALITY[kind];

/** Format du `<img>` de repli : `jpg` pour une photo (le `png` par défaut d'Astro est trop lourd). */
export const fallbackFormat = (kind: MediaKind): 'jpg' | 'png' =>
  kind === 'photo' ? 'jpg' : 'png';

/** Requête média d'un point de rupture de direction artistique. */
export function mediaFor(breakpoint: Breakpoint, base: BaseTokens = BASE): string {
  const name = breakpoint === 'narrow' ? '--pp-size-measure' : '--pp-size-page';
  return `(width < ${remOf(name, base)}rem)`;
}

/** Proportion numérique (largeur / hauteur) lue dans `--pp-ratio-*`. */
export function ratioValue(ratio: Ratio, base: BaseTokens = BASE): number {
  const name = `--pp-ratio-${ratio}`;
  const value = Number(read(base, name));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Token ${name} invalide`);
  return value;
}
