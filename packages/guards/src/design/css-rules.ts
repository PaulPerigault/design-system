// Règles sur les déclarations CSS (texte CSS, commentaires neutralisés).
import { PALETTE_HUES, SHADES } from './class-rules.ts';
import { NAMED_COLORS } from './named-colors.ts';

const DECLARATION = /([\w-]+)\s*:\s*([^;]*)(?:;|$)/g;
const GRADIENT = /(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i;
const BLUR = /\bblur\s*\(/i;
const DROP_SHADOW = /drop-shadow\s*\(/i;
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/i;
const COLOR_PROPERTY =
  /(?:^|-)color$|^(?:background|border(?:-[a-z]+){0,2}|outline(?:-[a-z]+){0,2}|fill|stroke|text-decoration|column-rule)$/;
const PALETTE = new RegExp(
  `var\\(\\s*--color-(?:${PALETTE_HUES.join('|')})-(?:${SHADES.join('|')})\\b`,
);
const RETRO = /glitch|typewriter|typing|scanline|blink-caret/i;
const KEYFRAMES = /@(?:-webkit-)?keyframes\s+([\w-]+)/gi;
const WIDE_TRACKING = /tracking-(?:wide|wider|widest)/;
const NEUTRAL = new Set(['none', 'inherit', 'initial', 'unset', 'revert']);
const SHADOW_PROPERTIES = new Set(['box-shadow', 'text-shadow', '-webkit-box-shadow']);
const BLUR_PROPERTIES = new Set(['backdrop-filter', '-webkit-backdrop-filter']);

interface Declaration {
  prop: string;
  value: string;
  index: number;
  block: number;
}

export function declarations(css: string): Declaration[] {
  const found: Declaration[] = [];
  const stack = [0];
  let created = 0;
  let position = 0;
  for (const match of css.matchAll(/[{}]|$/g)) {
    const matchIndex = match.index ?? 0;
    const segment = css.slice(position, matchIndex);
    // Avant `{` : sélecteur ou règle @ ; seules les déclarations closes par `;` comptent.
    const text = match[0] === '{' ? segment.slice(0, segment.lastIndexOf(';') + 1) : segment;
    for (const m of text.matchAll(DECLARATION)) {
      found.push({
        prop: (m[1] as string).toLowerCase(),
        value: (m[2] as string).trim(),
        index: position + (m.index ?? 0),
        block: stack.at(-1) ?? 0,
      });
    }
    position = matchIndex + match[0].length;
    if (match[0] === '{') stack.push((created += 1));
    else if (match[0] === '}' && stack.length > 1) stack.pop();
  }
  return found;
}

interface Hit {
  rule: string;
  index: number;
  excerpt: string;
}

const hit = (rule: string, d: Declaration, excerpt = `${d.prop}: ${d.value}`): Hit => ({ rule, index: d.index, excerpt });
const isNeutral = (value: string): boolean => NEUTRAL.has(value.toLowerCase());

function namedColor(d: Declaration, value: string): boolean {
  if (!COLOR_PROPERTY.test(d.prop)) return false;
  const words = value.replace(/var\(\s*--[\w-]+/gi, '').match(/[a-z]+/gi) ?? [];
  return words.some((word) => NAMED_COLORS.has(word.toLowerCase()));
}

function colorLiteral(d: Declaration): Hit | false {
  const value = d.value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/gi, '');
  const literal = HEX.test(value) || COLOR_FUNCTION.test(value);
  return (literal || namedColor(d, value)) && hit('color-literal', d);
}

function shadow(d: Declaration): Hit | false {
  const plain = SHADOW_PROPERTIES.has(d.prop) && !isNeutral(d.value);
  return (plain || DROP_SHADOW.test(d.value)) && hit('shadow', d);
}

function blur(d: Declaration): Hit | false {
  const plain = BLUR_PROPERTIES.has(d.prop) && !isNeutral(d.value);
  return (plain || BLUR.test(d.value)) && hit('blur', d);
}

const retro = (d: Declaration): Hit | false =>
  d.prop.startsWith('animation') && RETRO.test(d.value) && hit('retro-effect', d);

const CHECKS: ((d: Declaration) => Hit | false)[] = [
  (d) => GRADIENT.test(d.value) && hit('gradient', d),
  shadow,
  blur,
  colorLiteral,
  (d) => PALETTE.test(d.value) && hit('tailwind-palette', d),
  retro,
];

const isUppercase = (d: Declaration): boolean => d.prop === 'text-transform' && /^uppercase\b/i.test(d.value);
const isPositive = (d: Declaration): boolean =>
  d.prop === 'letter-spacing' && (Number.parseFloat(d.value) > 0 || WIDE_TRACKING.test(d.value));

/** `text-transform: uppercase` et `letter-spacing` positif dans un même bloc. */
function spacedCaps(decls: Declaration[]): Hit[] {
  const upper = new Set(decls.filter(isUppercase).map((d) => d.block));
  return decls
    .filter((d) => isPositive(d) && upper.has(d.block))
    .map((d) => hit('spaced-caps', d, `text-transform: uppercase + letter-spacing: ${d.value}`));
}

function keyframes(css: string): Hit[] {
  return [...css.matchAll(KEYFRAMES)]
    .filter((m) => RETRO.test(m[1] ?? ''))
    .map((m) => ({ rule: 'retro-effect', index: m.index ?? 0, excerpt: m[0] }));
}

export function cssHits(css: string): Hit[] {
  const decls = declarations(css);
  const direct = decls.flatMap((d) => CHECKS.map((check) => check(d)).filter(Boolean) as Hit[]);
  return [...direct, ...spacedCaps(decls), ...keyframes(css)];
}
