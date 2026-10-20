// Règles qui portent sur le texte brut (commentaires déjà neutralisés) : emoji, phrases génériques.
/** Sources de motifs ; l'espace vaut « un ou plusieurs blancs ». */
export const PHRASES = [
  'passionné(?:e|s|es)? par',
  'solutions innovantes',
  'à la pointe de',
  'dans un monde en constante évolution',
  "n'hésitez pas à",
  'synergie',
  'passionate about',
  'innovative solutions',
  'cutting-edge',
  'seamless',
  'game-changer',
  'best-in-class',
  "in today's fast-paced",
];

const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/gu;
const PHRASE = new RegExp(PHRASES.map((source) => source.replaceAll(' ', '\\s+')).join('|'), 'giu');
const TYPOGRAPHIC_APOSTROPHE = '\u2019';

/**
 * @param {string} text
 * @returns {{ rule: string, index: number, excerpt: string }[]}
 */
export function textHits(text) {
  const plain = text.replaceAll(TYPOGRAPHIC_APOSTROPHE, "'");
  const hit = (rule) => (match) => ({ rule, index: match.index, excerpt: match[0] });
  return [
    ...[...plain.matchAll(EMOJI)].map(hit('emoji')),
    ...[...plain.matchAll(PHRASE)].map(hit('generic-phrase')),
  ];
}
