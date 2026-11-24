// Texte fin en arc pour les badges de test : lettres tracées au trait (pas de police : le rendu
// SVG de `sharp` n'a ni `textPath` ni police garantie). Reproduit le piège des badges réels, un
// corps de quelques pixels qui s'écrase quand le badge est réduit ou déformé.
const GLYPHS: Record<string, string> = {
  A: 'M0 6V1L1 0H3L4 1V6M0 3H4',
  C: 'M4 0H0V6H4',
  D: 'M0 0V6H3L4 5V1L3 0Z',
  E: 'M4 0H0V6H4M0 3H3',
  H: 'M0 0V6M4 0V6M0 3H4',
  I: 'M2 0V6M0 0H4M0 6H4',
  L: 'M0 0V6H4',
  O: 'M0 0H4V6H0Z',
  R: 'M0 6V0H3L4 1V2L3 3H0M2 3L4 6',
  S: 'M4 0H0V3H4V6H0',
  T: 'M0 0H4M2 0V6',
  U: 'M0 0V6H4V0',
};
const UNIT = 3.4;
const ADVANCE = 6.4;
const WIDTH = 4;
const HEIGHT = 6;
const STROKE = 1.15;
const HALF = 2;
const DEGREES = 180 / Math.PI;

/** Lettres centrées au sommet d'un cercle de centre (`mid`, `mid`) et de rayon `radius`. */
export function arcText(text: string, ink: string, mid: number, radius: number): string {
  const step = (ADVANCE * UNIT) / radius;
  const start = -(step * (text.length - 1)) / HALF;
  const letters = [...text].flatMap((char, index) => {
    const path = GLYPHS[char];
    if (path === undefined) return [];
    const angle = (start + step * index) * DEGREES;
    const place = `translate(${mid} ${mid}) rotate(${angle}) translate(0 ${-radius})`;
    const shift = `translate(${(-WIDTH * UNIT) / HALF} ${(-HEIGHT * UNIT) / HALF})`;
    return [`<path transform="${place} ${shift} scale(${UNIT})" d="${path}"/>`];
  });
  return `<g fill="none" stroke="${ink}" stroke-width="${STROKE}" stroke-linecap="square">${letters.join('')}</g>`;
}
