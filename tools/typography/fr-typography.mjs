// Orthotypographie française d'un texte (convention usuelle, source de l'Imprimerie nationale non
// lue : [À VÉRIFIER]). Fonction pure et idempotente : seules les espaces ordinaires (U+0020) changent.
export const NBSP = ' ';
export const NNBSP = ' ';

const UNITS = 'px|rem|ms|s|Hz|kHz|pt|Kio|Mio|Gio|Ko|Mo|Go|ko|kB|MB|GB|°C';
const WORD = '\\p{L}\\p{N}';
const APOSTROPHE = "(?:'|&#39;|&#x27;)";

/** Une règle : nom, expression, remplacement. */
export const RULES = [
  { name: 'apostrophe', re: new RegExp(`(?<=[${WORD}])${APOSTROPHE}(?=[${WORD}])`, 'gu'), to: '’' },
  { name: 'deux-points', re: / :(?=\s|$)/g, to: `${NBSP}:` },
  { name: 'point-virgule', re: / ;(?=\s|$)/g, to: `${NNBSP};` },
  { name: 'interrogation', re: new RegExp(` \\?(?![${WORD}=?.])`, 'gu'), to: `${NNBSP}?` },
  { name: 'exclamation', re: new RegExp(` !(?![${WORD}=!])`, 'gu'), to: `${NNBSP}!` },
  { name: 'pourcentage', re: /(?<=\d) %/g, to: `${NNBSP}%` },
  {
    name: 'unite',
    re: new RegExp(`(?<=\\d) (?=(?:${UNITS})(?![${WORD}'’]))`, 'gu'),
    to: NNBSP,
  },
  {
    name: 'millier',
    re: /(?<![\d,.])(?<!\d )[1-9]\d{0,2}(?: \d{3})+(?!\d)/g,
    to: (match) => match.replaceAll(' ', NNBSP),
  },
  { name: 'guillemet-ouvrant', re: /« /g, to: `«${NBSP}` },
  { name: 'guillemet-fermant', re: / »/g, to: `${NBSP}»` },
];

/** @param {string} text @returns {string} */
export function frenchTypography(text) {
  return RULES.reduce((current, rule) => current.replace(rule.re, rule.to), text);
}
