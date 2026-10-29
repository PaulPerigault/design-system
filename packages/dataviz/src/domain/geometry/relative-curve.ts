import type { Pixel } from './line-path.ts';

const PRECISION = 1;

/** Arrondi à une décimale, sans `-0` : ce que le chemin relatif restitue exactement. */
export const round1 = (value: number): number => Number(value.toFixed(PRECISION)) + 0;

/** Un nombre colle au précédent quand il porte son propre signe, sinon une espace les sépare. */
const joinNumbers = (numbers: readonly number[]): string =>
  numbers.reduce((text, value) => {
    const item = String(value);
    return text === '' || item.startsWith('-') ? text + item : `${text} ${item}`;
  }, '');

/**
 * Courbe d'un segment continu en coordonnées relatives (`M` puis `l` aux pas arrondis) : un tiers
 * plus courte que `M…L…` absolus, pour un tracé écrit deux fois (fond et contour d'une aire). Les
 * pas sont des différences de valeurs déjà arrondies : l'erreur ne s'accumule pas.
 */
export function relativeCurve(segment: readonly Pixel[]): string {
  const points = segment.map((p) => ({ x: round1(p.x), y: round1(p.y) }));
  const [first, ...rest] = points;
  if (first === undefined) return '';
  const steps = rest.flatMap((p, i) => {
    const before = points[i] ?? first;
    return [round1(p.x - before.x), round1(p.y - before.y)];
  });
  const start = `M${joinNumbers([first.x, first.y])}`;
  return steps.length === 0 ? start : `${start}l${joinNumbers(steps)}`;
}
