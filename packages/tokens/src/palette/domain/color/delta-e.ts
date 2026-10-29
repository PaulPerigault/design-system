import type { Lab } from './lab.ts';

/**
 * CIEDE2000 : CIE 142-2001 ; implémentation de Sharma, Wu et Dalal (2005), « The CIEDE2000
 * color-difference formula », Color Research & Application 30(1), avec leurs données d'essai.
 */
const HALF_TURN = 180;
const FULL_TURN = 360;
const DEG = Math.PI / HALF_TURN;
const TWO = 2;
const SEVEN = 7;
const CHROMA_REFERENCE = 25;
const K = {
  pow25: CHROMA_REFERENCE ** SEVEN,
  lMid: 50,
  lSmooth: 20,
  sl: 0.015,
  sc: 0.045,
  sh: 0.015,
  rotCentre: 275,
  rotWidth: 25,
  rotMax: 30,
};
/** Termes du poids de teinte T : coefficient, multiple de h̄, décalage en degrés. */
const T_TERMS = [
  { weight: -0.17, multiple: 1, shift: -30 },
  { weight: 0.24, multiple: 2, shift: 0 },
  { weight: 0.32, multiple: 3, shift: 6 },
  { weight: -0.2, multiple: 4, shift: -63 },
];

const square = (value: number): number => value * value;
const pow7 = (value: number): number => value ** SEVEN;
const half = (value: number): number => value / TWO;
const chromaFactor = (cBar: number): number => Math.sqrt(pow7(cBar) / (pow7(cBar) + K.pow25));

const hueAngle = (a: number, b: number): number => {
  if (a === 0 && b === 0) return 0;
  const angle = Math.atan2(b, a) / DEG;
  return angle < 0 ? angle + FULL_TURN : angle;
};

const meanHue = (h1: number, h2: number, achromatic: boolean): number => {
  const sum = h1 + h2;
  if (achromatic) return sum;
  if (Math.abs(h1 - h2) <= HALF_TURN) return half(sum);
  return half(sum + (sum < FULL_TURN ? FULL_TURN : -FULL_TURN));
};

const deltaHue = (h1: number, h2: number, achromatic: boolean): number => {
  const diff = h2 - h1;
  if (achromatic || Math.abs(diff) <= HALF_TURN) return achromatic ? 0 : diff;
  return diff > HALF_TURN ? diff - FULL_TURN : diff + FULL_TURN;
};

const hueWeight = (hBar: number): number =>
  T_TERMS.reduce(
    (sum, { weight, multiple, shift }) => sum + weight * Math.cos((multiple * hBar + shift) * DEG),
    1,
  );

const rotation = (hBar: number, cBar: number): number => {
  const delta = K.rotMax * Math.exp(-square((hBar - K.rotCentre) / K.rotWidth));
  return -Math.sin(TWO * delta * DEG) * TWO * chromaFactor(cBar);
};

export function deltaE2000(x: Lab, y: Lab): number {
  const g = half(1 - chromaFactor(half(Math.hypot(x.a, x.b) + Math.hypot(y.a, y.b))));
  const [a1, a2] = [(1 + g) * x.a, (1 + g) * y.a];
  const [c1, c2] = [Math.hypot(a1, x.b), Math.hypot(a2, y.b)];
  const [h1, h2] = [hueAngle(a1, x.b), hueAngle(a2, y.b)];
  const gray = c1 * c2 === 0;
  const dH = TWO * Math.sqrt(c1 * c2) * Math.sin(half(deltaHue(h1, h2, gray) * DEG));
  const lBar = half(x.l + y.l);
  const cBar = half(c1 + c2);
  const hBar = meanHue(h1, h2, gray);
  const sl = 1 + (K.sl * square(lBar - K.lMid)) / Math.sqrt(K.lSmooth + square(lBar - K.lMid));
  const tl = (y.l - x.l) / sl;
  const tc = (c2 - c1) / (1 + K.sc * cBar);
  const th = dH / (1 + K.sh * cBar * hueWeight(hBar));
  return Math.sqrt(square(tl) + square(tc) + square(th) + rotation(hBar, cBar) * tc * th);
}
