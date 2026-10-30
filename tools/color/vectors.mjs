// Vecteurs de parité de `pp-color` : calculés par la référence TypeScript (`packages/tokens`),
// relus par le test Rust `crates/pp-color/tests/parity.rs`. Pur : `read` rend le texte d'un fichier.
import {
  hexToOklch,
  inSrgbGamut,
  oklchToLinearSrgb,
  oklchToSrgb,
  toHex,
} from '../../packages/tokens/src/lib/color.ts';
import { apcaLc, contrastRatio } from '../../packages/tokens/src/lib/contrast.ts';
import { fitToGamut } from '../../packages/tokens/src/palette/domain/color/gamut.ts';

const TOKENS = 'packages/tokens/src';
const THEMES = ['light', 'dark'];
const HUE_STEP = 30;
const HUES = Array.from({ length: 360 / HUE_STEP }, (_, index) => index * HUE_STEP);
// Clarté et chroma des balayages de teinte : texte sur fond clair, texte sur fond sombre.
const SWEEPS = { light: [0.47, 0.19], dark: [0.78, 0.12] };
const BOUNDARY = { l: 0.6, c: 0.5, past: 0.01 };
const EDGES = [
  ['noir', 0, 0, 0],
  ['blanc', 1, 0, 0],
  ['chroma nul, teinte 123', 0.5, 0, 123],
  ['hors gamut', 0.5, 0.4, 150],
  ['hors gamut, clarté 1', 1, 0.3, 30],
  ['clarté 0, chroma 0,1', 0, 0.1, 270],
];
const HEXES = ['#000000', '#ffffff', '#777777', '#ff0000', '#00ff00', '#0000ff', '#336699'];
const TEXTS = { black: '#000000', white: '#ffffff', mid: '#767676' };

const triple = ({ r, g, b }) => [r, g, b];
const oklchOf = ({ l, c, h }) => ({ l, c, h });
const ref = (l, c, h) => ({ oklch: [l, c, h] });

/** Feuilles `colorSpace: oklch` d'un arbre DTCG : [chemin pointé, [l, c, h]]. */
function colorLeaves(node, path = []) {
  const value = node.$value;
  if (value?.colorSpace === 'oklch') return [[path.join('.'), value.components]];
  return Object.entries(node)
    .filter(([key, child]) => !key.startsWith('$') && typeof child === 'object')
    .flatMap(([key, child]) => colorLeaves(child, [...path, key]));
}

function colorCase(name, l, c, h) {
  const color = { l, c, h };
  const hex = inSrgbGamut(color) ? toHex(color) : null;
  return {
    name,
    oklch: [l, c, h],
    srgb: triple(oklchToSrgb(color)),
    linear: triple(oklchToLinearSrgb(color)),
    inGamut: inSrgbGamut(color),
    fit: oklchOf(fitToGamut(color)),
    hex,
  };
}

function boundaries() {
  return HUES.flatMap((h) => {
    const { c } = fitToGamut({ l: BOUNDARY.l, c: BOUNDARY.c, h });
    return [
      [`bord ${h}°`, BOUNDARY.l, c, h],
      [`au-delà du bord ${h}°`, BOUNDARY.l, c + BOUNDARY.past, h],
    ];
  });
}

function sweeps() {
  return THEMES.flatMap((theme) =>
    HUES.map((h) => [`teinte ${h}° ${theme}`, SWEEPS[theme][0], SWEEPS[theme][1], h]),
  );
}

/** Entrée de `contrastRatio` : `#rrggbb` ou objet OKLCH. */
const asInput = ({ hex, oklch: [l, c, h] = [] }) => hex ?? { l, c, h };

function contrastCase(name, fg, bg) {
  const [text, background] = [asInput(fg), asInput(bg)];
  try {
    const ratio = contrastRatio(text, background);
    return { name, fg, bg, ratio, centi: Math.round(ratio * 100), lc: apcaLc(text, background) };
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    return { name, fg, bg, error: 'out-of-gamut' };
  }
}

export function buildVectors(read) {
  const roles = THEMES.map((theme) => [
    theme,
    colorLeaves(JSON.parse(read(`${TOKENS}/tokens/${theme}.tokens.json`))),
  ]);
  const named = roles.flatMap(([theme, leaves]) =>
    leaves.map(([path, c]) => [`encre.${theme}.${path}`, ...c]),
  );
  const colors = [...named, ...EDGES, ...sweeps(), ...boundaries()].map((row) => colorCase(...row));
  const at = (theme, path) =>
    ref(...Object.fromEntries(roles)[theme].find(([key]) => key === path)[1]);
  const pairs = JSON.parse(read(`${TOKENS}/roles.json`)).pairs;
  const roleCases = THEMES.flatMap((theme) =>
    pairs.map(({ fg, bg }) =>
      contrastCase(`${theme} : ${fg} sur ${bg}`, at(theme, fg), at(theme, bg)),
    ),
  );
  const sweepCases = THEMES.flatMap((theme) =>
    HUES.map((h) =>
      contrastCase(`teinte ${h}° ${theme}`, ref(...SWEEPS[theme], h), at(theme, 'color.bg')),
    ),
  );
  const hexCases = Object.entries(TEXTS).flatMap(([name, hex]) =>
    ['#ffffff', '#000000'].map((bg) => contrastCase(`${name} sur ${bg}`, { hex }, { hex: bg })),
  );
  return {
    source: ['packages/tokens/src/lib/color.ts', 'packages/tokens/src/lib/contrast.ts'],
    colors,
    hexes: HEXES.map((hex) => ({ hex, oklch: oklchOf(hexToOklch(hex)) })),
    contrasts: [...roleCases, ...sweepCases, ...hexCases],
  };
}
