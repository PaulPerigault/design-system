// Analyse des pixels d'une capture de la scène (fonctions pures) : part couverte, cadre occupé,
// teinte dominante, contraste. Les couleurs de jetons arrivent déjà en sRGB.
import type { Image } from './png.ts';

export type Rgb = readonly [number, number, number];
const BG_TOLERANCE = 10;
const MIN_SATURATION = 0.25;
const HUE_BIN = 10;
const HUE_BINS = 36;
const HALF_TURN = 180;
const FULL_TURN = 360;
const SECTOR = 60;

export interface Coverage {
  covered: number;
  box: { left: number; top: number; right: number; bottom: number } | null;
}

const pixelAt = (image: Image, i: number): Rgb => [
  image.data[i * 4] ?? 0,
  image.data[i * 4 + 1] ?? 0,
  image.data[i * 4 + 2] ?? 0,
];

const differs = (px: Rgb, bg: Rgb): boolean =>
  Math.max(...px.map((c, k) => Math.abs(c - (bg[k] ?? 0)))) > BG_TOLERANCE;

/** Part des pixels qui diffèrent du fond et boîte englobante de ces pixels. */
export function coverage(image: Image, bg: Rgb): Coverage {
  const box = { left: image.width, top: image.height, right: -1, bottom: -1 };
  let covered = 0;
  for (let i = 0; i < image.width * image.height; i += 1) {
    if (!differs(pixelAt(image, i), bg)) continue;
    const [x, y] = [i % image.width, Math.floor(i / image.width)];
    covered += 1;
    box.left = Math.min(box.left, x);
    box.right = Math.max(box.right, x);
    box.top = Math.min(box.top, y);
    box.bottom = Math.max(box.bottom, y);
  }
  return { covered: covered / (image.width * image.height), box: covered === 0 ? null : box };
}

export function hueOf([r, g, b]: Rgb): { hue: number; saturation: number } {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const [max, min] = [Math.max(rn, gn, bn), Math.min(rn, gn, bn)];
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0 };
  const sector =
    max === rn
      ? ((gn - bn) / delta) % 6
      : max === gn
        ? (bn - rn) / delta + 2
        : (rn - gn) / delta + 4;
  const lightness = (max + min) / 2;
  return {
    hue: (sector * SECTOR + FULL_TURN) % FULL_TURN,
    saturation: delta / (1 - Math.abs(2 * lightness - 1) || 1),
  };
}

/** Teinte la plus fréquente parmi les pixels saturés qui diffèrent du fond, au centre de sa classe. */
export function dominantHue(image: Image, bg: Rgb): number | null {
  const bins = new Array<number>(HUE_BINS).fill(0);
  for (let i = 0; i < image.width * image.height; i += 1) {
    const px = pixelAt(image, i);
    const { hue, saturation } = hueOf(px);
    if (differs(px, bg) && saturation > MIN_SATURATION) {
      bins[Math.floor(hue / HUE_BIN) % HUE_BINS] =
        (bins[Math.floor(hue / HUE_BIN) % HUE_BINS] ?? 0) + 1;
    }
  }
  const best = Math.max(...bins);
  return best === 0 ? null : bins.indexOf(best) * HUE_BIN + HUE_BIN / 2;
}

/** Écart angulaire le plus court entre deux teintes, en degrés. */
export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % FULL_TURN;
  return d > HALF_TURN ? FULL_TURN - d : d;
};

const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** Rapport de contraste WCAG 2 entre deux couleurs sRGB. */
export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [Math.max(luminance(a), luminance(b)), Math.min(luminance(a), luminance(b))];
  return (hi + 0.05) / (lo + 0.05);
}
