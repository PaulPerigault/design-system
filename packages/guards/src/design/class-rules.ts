// Règles sur les classes utilitaires des attributs `class`, `className` et `class:list`.
export const PALETTE_HUES = `slate gray zinc neutral stone red orange amber yellow lime green
emerald teal cyan sky blue indigo violet purple fuchsia pink rose`.split(/\s+/);
export const SHADES = '50 100 200 300 400 500 600 700 800 900 950'.split(' ');

const ATTRIBUTE =
  /(?<![\w-])(?:class|className|class:list)\s*=\s*("[^"]*"|'[^']*'|`[^`]*`|\{(?:[^{}]|\{[^{}]*\})*\})/dg;
const SEPARATOR = /[\s"'`,{}]/;
const PALETTE = new RegExp(
  `^(?:[a-z]+-)+(?:${PALETTE_HUES.join('|')})-(?:${SHADES.join('|')})(?:/[\\w.%\\[\\]-]+)?$`,
);
const CHECKS = [
  ['gradient', /^bg-(?:gradient-|linear-|radial|conic)/],
  ['shadow', /^(?:drop-|text-|inset-)?shadow(?:-(?!none$)|$)/],
  ['blur', /^(?:blur(?:-|$)|backdrop-)/],
  ['tailwind-palette', PALETTE],
  ['arbitrary-value', /^(?:-?[a-z][\w-]*-\[.+\]|\[[\w-]+:.+\])/],
  ['arbitrary-value', /^-?[a-z][\w-]*-\((?!(?:[a-z-]+:)?--pp-)/],
  // Axe en ligne physique ; équivalents logiques : ms-/me-, ps-/pe-, start-/end-, text-start…
  [
    'physical-property',
    /^(?:(?:scroll-)?[mp][lr]-|(?:left|right)-|(?:text|float|clear)-(?:left|right)$)/,
  ],
  ['physical-property', /^(?:rounded-(?:[lr]|[tb][lr])|border-[lr])(?:-|$)/],
];
const WIDE_TRACKING = /^tracking-(?:wide|wider|widest)$/;
const CUSTOM_TRACKING = /^tracking-\[\s*([^\]]+)\]$/;

/** Découpe en jetons ; les séparateurs (virgule comprise) sont ignorés dans les crochets. */
function tokenize(value) {
  const tokens = [];
  let depth = 0;
  let begin = -1;
  const flush = (end) => {
    if (begin >= 0) tokens.push({ raw: value.slice(begin, end), index: begin });
    begin = -1;
  };
  for (const [i, char] of [...value].entries()) {
    // Un `[` ouvre une valeur arbitraire seulement au milieu d'un jeton (`bg-[`), pas un tableau JS.
    if (char === '[' && begin >= 0) depth += 1;
    else if (char === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && SEPARATOR.test(char)) flush(i);
    else if (begin < 0) begin = i;
  }
  flush(value.length);
  return tokens;
}

/** Retire variantes (`md:`, `data-[x]:`), `!` et `-` initial : `md:!-mt-2` devient `mt-2`. */
function utilityOf(token) {
  let depth = 0;
  let cut = 0;
  for (const [i, char] of [...token].entries()) {
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) cut = i + 1;
  }
  return token.slice(cut).replace(/^[!-]+|!$/g, '');
}

const isSpaced = ({ utility }) =>
  WIDE_TRACKING.test(utility) || Number.parseFloat(CUSTOM_TRACKING.exec(utility)?.[1]) > 0;

function spacedCaps(tokens) {
  if (!tokens.some(({ utility }) => utility === 'uppercase')) return [];
  return tokens
    .filter(isSpaced)
    .map((t) => ({ rule: 'spaced-caps', index: t.index, excerpt: `uppercase ${t.raw}` }));
}

function tokenHits({ utility, raw, index }) {
  return CHECKS.filter(([, pattern]) => pattern.test(utility)).map(([rule]) => ({
    rule,
    index,
    excerpt: raw,
  }));
}

/**
 * @param {string} text source (commentaires neutralisés)
 * @returns {{ rule: string, index: number, excerpt: string }[]}
 */
export function classHits(text) {
  return [...text.matchAll(ATTRIBUTE)].flatMap((attribute) => {
    const [start] = attribute.indices[1];
    const tokens = tokenize(attribute[1]).map((t) => ({
      raw: t.raw,
      utility: utilityOf(t.raw),
      index: start + t.index,
    }));
    return [...tokens.flatMap(tokenHits), ...spacedCaps(tokens)];
  });
}
