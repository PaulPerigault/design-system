// Lisibilité des textes de la documentation (gap.md n° 23) : phrases longues et voix passive.
// Heuristiques simples sur du français : des avertissements, jamais un échec (convention GOV.UK).

export const MAX_WORDS = 25;
// `\b` ne reconnaît pas les lettres accentuées : lookarounds Unicode à la place.
const PASSIVE =
  /(?<!\p{L})(?:est|sont|était|étaient|sera|seront|soit|soient)\s+\p{L}+(?:é|ée|és|ées)(?!\p{L})(?:\s+par(?!\p{L}))?/giu;
/** Participes en -é qui ne signalent pas une voix passive (adjectifs courants). */
const NOT_PASSIVE = new Set(['est opté']);

/** Texte lisible d'un fichier `.astro` : sans frontmatter, scripts, styles, code ni balises. */
export function visibleText(source) {
  return source
    .replace(/^---[\s\S]*?---/, ' ')
    .replace(/<(script|style|pre|code)[\s\S]*?<\/\1>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const sentencesOf = (text) =>
  text
    .split(/(?<=[.!?…])\s+(?=[\p{Lu}«"“])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

export const wordCount = (sentence) => sentence.split(/\s+/).filter(Boolean).length;

/** @returns {{ kind: 'long' | 'passive', sentence: string, detail: string }[]} */
export function adviseSentence(sentence) {
  const advice = [];
  const words = wordCount(sentence);
  if (words > MAX_WORDS)
    advice.push({ kind: 'long', sentence, detail: `${words} mots (max ${MAX_WORDS})` });
  for (const match of sentence.matchAll(PASSIVE)) {
    if (!NOT_PASSIVE.has(match[0].toLowerCase()))
      advice.push({ kind: 'passive', sentence, detail: `voix passive : « ${match[0].trim()} »` });
  }
  return advice;
}

export function adviseSource(source) {
  return sentencesOf(visibleText(source)).flatMap(adviseSentence);
}
