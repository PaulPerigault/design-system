// Outil validate_snippet : analyse de texte en mémoire, jamais d'exécution ni de fichier.
// Règles de @paulperigault/guards (`analyze`, injecté) + jetons inconnus, `style` en ligne et
// `<img>` sans dimensions.
import { defineTool, schemas } from './schemas.ts';
import type { ToolDefinition } from './schemas.ts';
import { closest } from './tools-components.ts';

export interface Hit {
  rule: string;
  line: number;
  message: string;
}

export type Violation = Hit & { fix: string };

export interface SnippetDeps {
  /** Analyse de conception (`@paulperigault/guards/design`). */
  analyze: (file: string, text: string, rules: Set<string>) => Hit[];
  ruleIds: readonly string[];
  tokenNames: string[];
}

type Language = 'astro' | 'html' | 'css' | 'md';

const MARKUP = new Set<Language>(['astro', 'html', 'md']);
const REFERENCE = /var\(\s*(--pp-[\w-]+)/g;
const DECLARATION = /(--pp-[\w-]+)\s*:/g;
const INLINE_STYLE = /<[a-z][\w.:-]*\b[^<>]*?\sstyle\s*=/gi;
const IMG = /<img\b[^>]*>/gi;
const HAS_WIDTH = /\swidth\s*=/i;
const HAS_HEIGHT = /\sheight\s*=/i;

export const FIXES: Record<string, string> = {
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
};
const FALLBACK_FIX = 'Voir get_component et get_tokens pour l’équivalent du design system.';

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

/** Références `var(--pp-…)` vers un nom ni connu ni déclaré dans l'extrait. */
export function unknownTokens(code: string, names: string[]): Violation[] {
  const known = new Set([...names, ...[...code.matchAll(DECLARATION)].map((m) => m[1])]);
  return [...code.matchAll(REFERENCE)]
    .filter((match) => !known.has(match[1]))
    .map((match) => {
      const near = closest(match[1] ?? '', names);
      const hint = near.length > 0 ? ` Proche : ${near.join(', ')}.` : '';
      return {
        rule: 'unknown-token',
        line: lineOf(code, match.index),
        message: `jeton inconnu ${match[1]}`,
        fix: `${FIXES['unknown-token']}${hint}`,
      };
    });
}

export function inlineStyles(code: string): Violation[] {
  return [...code.matchAll(INLINE_STYLE)].map((match) => ({
    rule: 'inline-style',
    line: lineOf(code, match.index),
    message: 'attribut style en ligne : ignoré par la CSP stricte des sites consommateurs',
    fix: FIXES['inline-style'] ?? FALLBACK_FIX,
  }));
}

export function imagesWithoutSize(code: string): Violation[] {
  return [...code.matchAll(IMG)]
    .filter((match) => !HAS_WIDTH.test(match[0]) || !HAS_HEIGHT.test(match[0]))
    .map((match) => ({
      rule: 'image-dimensions',
      line: lineOf(code, match.index),
      message: 'image sans width ni height : décalage de mise en page au chargement',
      fix: FIXES['image-dimensions'] ?? FALLBACK_FIX,
    }));
}

export function validateSnippet(
  { language, code }: { language: Language; code: string },
  { analyze, ruleIds, tokenNames }: SnippetDeps,
) {
  const design = analyze(`extrait.${language}`, code, new Set(ruleIds)).map(
    ({ rule, line, message }) => ({ rule, line, message, fix: FIXES[rule] ?? FALLBACK_FIX }),
  );
  const markup = MARKUP.has(language) ? [...inlineStyles(code), ...imagesWithoutSize(code)] : [];
  const violations = [...design, ...unknownTokens(code, tokenNames), ...markup].sort(
    (a, b) => a.line - b.line || a.rule.localeCompare(b.rule, 'en'),
  );
  return { language, valid: violations.length === 0, count: violations.length, violations };
}

export function snippetTools(deps: SnippetDeps): ToolDefinition[] {
  return [
    defineTool({
      name: 'validate_snippet',
      title: 'Valider un extrait',
      description:
        'Analyse statique d’un extrait astro, html, css ou md (jamais exécuté) avec les ' +
        'garde-fous du design system : interdits de conception, jetons --pp-* inconnus, ' +
        'style en ligne, images sans dimensions. Chaque violation porte la règle, la ligne, ' +
        'un message et une correction proposée.',
      schema: schemas.validate_snippet,
      run: (input) => validateSnippet(input, deps),
    }),
  ];
}
