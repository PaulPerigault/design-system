// Analyse locale d'une capture (fonctions pures) : couleur du support nu d'une médaille, part des
// pixels de son centre qui s'en écartent, écart entre deux captures.
import type { Image } from './png.ts';
import type { Rgb } from './pixels.ts';

const pixel = (image: Image, x: number, y: number): Rgb => {
  const at = (Math.round(y) * image.width + Math.round(x)) * 4;
  return [image.data[at] ?? 0, image.data[at + 1] ?? 0, image.data[at + 2] ?? 0];
};

const inside = (image: Image, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < image.width && y < image.height;

export interface Disc {
  x: number;
  y: number;
  radius: number;
}

/** Pixels de l'anneau compris entre `from` et `to` fois le rayon (bords de l'image exclus). */
function ring(image: Image, disc: Disc, from: number, to: number): Rgb[] {
  const found: Rgb[] = [];
  const reach = Math.ceil(disc.radius * to);
  for (let dy = -reach; dy <= reach; dy += 1) {
    for (let dx = -reach; dx <= reach; dx += 1) {
      const distance = Math.hypot(dx, dy) / disc.radius;
      const [x, y] = [disc.x + dx, disc.y + dy];
      if (distance >= from && distance <= to && inside(image, x, y)) found.push(pixel(image, x, y));
    }
  }
  return found;
}

const median = (values: number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

/** Couleur médiane du support nu : anneau entre le badge et le biseau (0,78 à 0,86 du rayon). */
export function supportColor(image: Image, disc: Disc): Rgb {
  const pixels = ring(image, disc, 0.78, 0.86);
  return [0, 1, 2].map((k) => median(pixels.map((p) => p[k] ?? 0))) as unknown as Rgb;
}

const gap = (a: Rgb, b: Rgb): number => Math.max(...a.map((c, k) => Math.abs(c - (b[k] ?? 0))));

/** Part des pixels du disque central (0,55 du rayon) qui s'écartent de `reference`. */
export function centerDifference(
  image: Image,
  disc: Disc,
  reference: Rgb,
  tolerance: number,
): number {
  const pixels = ring(image, disc, 0, 0.55);
  if (pixels.length === 0) return 0;
  return pixels.filter((p) => gap(p, reference) > tolerance).length / pixels.length;
}

/** Part des pixels qui diffèrent entre deux captures de même taille. */
export function changedShare(a: Image, b: Image, tolerance: number): number {
  if (a.width !== b.width || a.height !== b.height) return 1;
  let changed = 0;
  for (let i = 0; i < a.width * a.height; i += 1) {
    if (
      gap(
        pixel(a, i % a.width, Math.floor(i / a.width)),
        pixel(b, i % a.width, Math.floor(i / a.width)),
      ) > tolerance
    )
      changed += 1;
  }
  return changed / (a.width * a.height);
}
