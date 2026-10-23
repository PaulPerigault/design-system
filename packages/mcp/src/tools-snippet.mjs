// Outil validate_snippet : analyse de texte en mémoire, jamais d'exécution ni de fichier.
// Règles de @paulperigault/guards (`analyze`, injecté) + jetons inconnus, `style` en ligne et
// `<img>` sans dimensions.
import { closest } from './tools-components.mjs';

const EXTENSIONS = Object.freeze({ astro: '.astro', html: '.html', css: '.css', md: '.md' });
const MARKUP = new Set(['astro', 'html', 'md']);
const REFERENCE = /var\(\s*(--pp-[\w-]+)/g;
const DECLARATION = /(--pp-[\w-]+)\s*:/g;
const INLINE_STYLE = /<[a-z][\w.:-]*\b[^<>]*?\sstyle\s*=/gi;
const IMG = /<img\b[^>]*>/gi;
const HAS_WIDTH = /\swidth\s*=/i;
const HAS_HEIGHT = /\sheight\s*=/i;

export const FIXES = Object.freeze({
  gradient: 'Fond uni : background-color: var(--pp-color-surface) ou var(--pp-color-bg).',
  shadow: 'Retirer l’ombre ; séparer par border: var(--pp-size-rule) solid var(--pp-color-line).',
  blur: 'Retirer le flou ; un fond opaque var(--pp-color-surface) garde le texte lisible.',
  emoji: 'Remplacer l’emoji par un mot, ou par une icône SVG décorative (aria-hidden="true").',
  'spaced-caps': 'Garder la casse du texte, sans text-transform: uppercase ni letter-spacing.',
  'tailwind-palette':
    'Utiliser les couleurs du @theme de @paulperigault/css (jetons --pp-color-*).',
  'arbitrary-value': 'Remplacer la valeur entre crochets par un jeton --pp-* (voir get_tokens).',
  'color-literal': 'Remplacer la couleur brute par var(--pp-color-…) (voir get_tokens).',
  'retro-effect': 'Retirer l’effet ; une transition var(--pp-duration-fast) suffit.',
  'generic-phrase': 'Écrire un fait vérifiable (ce qui est fait, pour qui, avec quel résultat).',
  'physical-property': 'Employer la propriété logique indiquée (inline-*, block-*, inset-*).',
  'unknown-token': 'Employer un jeton existant (voir get_tokens).',
  'inline-style':
    'Retirer l’attribut style (CSP stricte) : classe ou attribut data-* mappé en CSS.',
  'image-dimensions': 'Ajouter width et height, ou utiliser le composant Photo qui les pose.',
});
const FALLBACK_FIX = 'Voir get_component et get_tokens pour l’équivalent du design system.';

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Références `var(--pp-…)` vers un nom ni connu ni déclaré dans l'extrait. */
export function unknownTokens(code, names) {
  const known = new Set([...names, ...[...code.matchAll(DECLARATION)].map((m) => m[1])]);
  return [...code.matchAll(REFERENCE)]
    .filter((match) => !known.has(match[1]))
    .map((match) => {
      const near = closest(match[1], names);
      const hint = near.length > 0 ? ` Proche : ${near.join(', ')}.` : '';
      return {
        rule: 'unknown-token',
        line: lineOf(code, match.index),
        message: `jeton inconnu ${match[1]}`,
        fix: `${FIXES['unknown-token']}${hint}`,
      };
    });
}

export function inlineStyles(code) {
  return [...code.matchAll(INLINE_STYLE)].map((match) => ({
    rule: 'inline-style',
    line: lineOf(code, match.index),
    message: 'attribut style en ligne : ignoré par la CSP stricte des sites consommateurs',
    fix: FIXES['inline-style'],
  }));
}

export function imagesWithoutSize(code) {
  return [...code.matchAll(IMG)]
    .filter((match) => !HAS_WIDTH.test(match[0]) || !HAS_HEIGHT.test(match[0]))
    .map((match) => ({
      rule: 'image-dimensions',
      line: lineOf(code, match.index),
      message: 'image sans width ni height : décalage de mise en page au chargement',
      fix: FIXES['image-dimensions'],
    }));
}

/**
 * @param {{ language: keyof EXTENSIONS, code: string }} input
 * @param {{ analyze: Function, ruleIds: string[], tokenNames: string[] }} deps
 */
export function validateSnippet({ language, code }, { analyze, ruleIds, tokenNames }) {
  const design = analyze(`extrait${EXTENSIONS[language]}`, code, new Set(ruleIds)).map(
    ({ rule, line, message }) => ({ rule, line, message, fix: FIXES[rule] ?? FALLBACK_FIX }),
  );
  const markup = MARKUP.has(language) ? [...inlineStyles(code), ...imagesWithoutSize(code)] : [];
  const violations = [...design, ...unknownTokens(code, tokenNames), ...markup].sort(
    (a, b) => a.line - b.line || a.rule.localeCompare(b.rule, 'en'),
  );
  return { language, valid: violations.length === 0, count: violations.length, violations };
}

/** @param {{ analyze: Function, ruleIds: string[], tokenNames: string[] }} deps */
export function snippetTools(deps) {
  return [
    {
      name: 'validate_snippet',
      title: 'Valider un extrait',
      description:
        'Analyse statique d’un extrait astro, html, css ou md (jamais exécuté) avec les ' +
        'garde-fous du design system : interdits de conception, jetons --pp-* inconnus, ' +
        'style en ligne, images sans dimensions. Chaque violation porte la règle, la ligne, ' +
        'un message et une correction proposée.',
      run: (input) => validateSnippet(input, deps),
    },
  ];
}
