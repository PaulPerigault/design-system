/**
 * Calcule les métriques des polices de repli (Arial, Courier New) pour qu'elles occupent la même
 * place qu'Atkinson Hyperlegible Next et Mono pendant le chargement : moins de décalage de mise
 * en page au remplacement (`font-display: swap`).
 *
 * Usage : `node scripts/fallback-metrics.mjs` réécrit le bloc balisé de `src/fonts.css` ;
 * `--check` échoue (code 1) si le bloc diffère de ce que le calcul produit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import arial from '@capsizecss/metrics/arial';
import atkinsonHyperlegibleMono from '@capsizecss/metrics/atkinsonHyperlegibleMono';
import atkinsonHyperlegibleNext from '@capsizecss/metrics/atkinsonHyperlegibleNext';
import courierNew from '@capsizecss/metrics/courierNew';

export const START = '/* fallback:start */';
export const END = '/* fallback:end */';
export const FONTS_CSS = new URL('../src/fonts.css', import.meta.url);

const PERCENT = 100;
const DECIMALS = 2;

export const PAIRS = [
  {
    family: 'Atkinson Next Fallback',
    local: 'Arial',
    font: atkinsonHyperlegibleNext,
    fallback: arial,
  },
  {
    family: 'Atkinson Mono Fallback',
    local: 'Courier New',
    font: atkinsonHyperlegibleMono,
    fallback: courierNew,
  },
];

/**
 * Formate un rapport (0.9959…) en pourcentage CSS arrondi à deux décimales, sans zéros finaux
 * (`99.6%`, `0%`) : c'est la forme que Prettier imprime, le bloc reste donc stable au formatage.
 */
export function percent(ratio) {
  return `${Number((ratio * PERCENT).toFixed(DECIMALS))}%`;
}

/** Rapports bruts : `size-adjust` aligne les largeurs moyennes, le reste se corrige d'autant. */
export function computeFallback(font, fallback) {
  const sizeAdjust = font.xWidthAvg / font.unitsPerEm / (fallback.xWidthAvg / fallback.unitsPerEm);
  const perEm = (value) => value / font.unitsPerEm / sizeAdjust;
  return {
    sizeAdjust,
    ascentOverride: perEm(font.ascent),
    descentOverride: perEm(Math.abs(font.descent)),
    lineGapOverride: perEm(font.lineGap),
  };
}

/** Une règle `@font-face` de repli, au format Prettier du dépôt. */
export function renderFontFace({ family, local, font, fallback }) {
  const m = computeFallback(font, fallback);
  return [
    '@font-face {',
    `  font-family: '${family}';`,
    `  src: local('${local}');`,
    `  size-adjust: ${percent(m.sizeAdjust)};`,
    `  ascent-override: ${percent(m.ascentOverride)};`,
    `  descent-override: ${percent(m.descentOverride)};`,
    `  line-gap-override: ${percent(m.lineGapOverride)};`,
    '}',
  ].join('\n');
}

/** Bloc complet, balises comprises. */
export function renderBlock(pairs = PAIRS) {
  return [START, pairs.map(renderFontFace).join('\n\n'), END].join('\n');
}

/** Remplace le bloc balisé de `css` ; lève une erreur si les balises manquent. */
export function replaceBlock(css, block = renderBlock()) {
  const start = css.indexOf(START);
  const end = css.indexOf(END, start);
  if (start === -1 || end === -1) {
    throw new Error(`Balises ${START} … ${END} introuvables.`);
  }
  return css.slice(0, start) + block + css.slice(end + END.length);
}

/** Point d'entrée, FS et sortie injectés : renvoie le code de sortie. */
export function run({ argv, read, write, log }) {
  const css = read(FONTS_CSS);
  const next = replaceBlock(css);
  if (argv.includes('--check')) {
    if (next === css) return 0;
    log('fonts.css : bloc fallback obsolète, relancer scripts/fallback-metrics.mjs.');
    return 1;
  }
  if (next !== css) write(FONTS_CSS, next);
  log('fonts.css : métriques de repli à jour.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run({
    argv: process.argv.slice(2),
    read: (url) => readFileSync(url, 'utf8'),
    write: (url, text) => writeFileSync(url, text),
    log: (message) => console.log(message),
  });
}
