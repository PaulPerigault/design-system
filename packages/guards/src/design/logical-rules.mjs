// Règle « propriétés logiques » : une déclaration CSS physique (gauche, droite, haut, bas,
// largeur, hauteur) casse l'écriture de droite à gauche et l'écriture verticale.
import { declarations } from './css-rules.mjs';

const SIDE = '(?:top|right|bottom|left)';
/** Propriétés physiques et leur équivalent logique, pour le message. */
const PROPERTIES = [
  [
    new RegExp(`^(?:margin|padding|scroll-margin|scroll-padding)-${SIDE}$`),
    'margin|padding-block|inline-start|end',
  ],
  [new RegExp(`^border-${SIDE}(?:-(?:width|style|color))?$`), 'border-block|inline-start|end'],
  [/^border-(?:top|bottom)-(?:left|right)-radius$/, 'border-start-start-radius…'],
  [/^(?:min-|max-)?width$/, 'inline-size'],
  [/^(?:min-|max-)?height$/, 'block-size'],
  [new RegExp(`^${SIDE}$`), 'inset-block|inline-start|end'],
  [/^overflow-[xy]$/, 'overflow-inline|block'],
];
/** Valeurs physiques de propriétés par ailleurs neutres. */
const VALUES = new Map([
  ['text-align', /^(?:left|right)$/],
  ['float', /^(?:left|right)$/],
  ['clear', /^(?:left|right)$/],
  ['resize', /^(?:horizontal|vertical)$/],
]);

function logicalOf({ prop, value }) {
  const property = PROPERTIES.find(([pattern]) => pattern.test(prop));
  if (property) return property[1];
  return VALUES.get(prop)?.test(value.toLowerCase()) ? 'start|end, inline|block' : undefined;
}

/**
 * @param {string} css texte CSS, commentaires neutralisés
 * @returns {{ rule: string, index: number, excerpt: string }[]}
 */
export function logicalHits(css) {
  return declarations(css).flatMap((d) => {
    const logical = logicalOf(d);
    if (logical === undefined) return [];
    return [
      { rule: 'physical-property', index: d.index, excerpt: `${d.prop}: ${d.value} → ${logical}` },
    ];
  });
}
