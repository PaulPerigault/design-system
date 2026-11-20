// Scène 3D de jalons : aucune couleur, durée ni courbe littérale dans les sources (ADR-0012,
// décision 4). Tout vient des jetons --pp-* lus sur la page. Lecture de texte pur : commentaires
// retirés, tests ignorés (dossiers `test`, fichiers `*.test.*`, `tests.rs`, bloc `#[cfg(test)]`).
import { lineOf } from '../text.ts';

export type SceneRule = 'color-literal' | 'duration-literal' | 'easing-literal';

export const SCENE_MESSAGES: Record<SceneRule, string> = {
  'color-literal': 'couleur littérale interdite dans la scène, lire le jeton --pp-* du thème',
  'duration-literal': 'durée littérale interdite dans la scène, lire --pp-duration-*',
  'easing-literal': 'courbe littérale interdite dans la scène, lire --pp-easing-standard',
};

const NUMBER = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)`;
const PATTERNS: readonly [SceneRule, RegExp][] = [
  ['color-literal', /#[0-9a-fA-F]{3,8}\b/g],
  [
    'color-literal',
    new RegExp(String.raw`\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(\s*${NUMBER}`, 'g'),
  ],
  // Triplet de nombres : une couleur écrite en GLSL (`vec3(0.2, 0.4, 0.6)`).
  [
    'color-literal',
    new RegExp(String.raw`\bvec[34]\(\s*${NUMBER}\s*,\s*${NUMBER}\s*,\s*${NUMBER}`, 'g'),
  ],
  ['duration-literal', /(?<![\w-])(?:\d+(?:\.\d+)?|\.\d+)(?:ms|s)\b/g],
  ['easing-literal', new RegExp(String.raw`\bcubic-bezier\(\s*${NUMBER}`, 'g')],
];

const LINE_COMMENT = /\/\/[^\n]*/g;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g;
const RUST_TESTS = /^[ \t]*#\[cfg\(test\)\][\s\S]*$/m;
const TEST_PATH = /(?:^|\/)(?:tests?|__tests__)\/|\.test\.[cm]?[jt]sx?$|(?:^|\/)tests\.rs$/;
const EXCERPT_MAX = 40;

const blank = (text: string): string => text.replace(/[^\n]/g, ' ');

export const isTestPath = (path: string): boolean => TEST_PATH.test(path);

/** Commentaires et module de tests Rust remplacés par des blancs : lignes et index conservés. */
export function neutralize(text: string): string {
  return text.replace(BLOCK_COMMENT, blank).replace(LINE_COMMENT, blank).replace(RUST_TESTS, blank);
}

export interface SceneHit {
  rule: SceneRule;
  line: number;
  excerpt: string;
}

export function sceneHits(text: string): SceneHit[] {
  const clean = neutralize(text);
  return PATTERNS.flatMap(([rule, pattern]) =>
    [...clean.matchAll(pattern)].map((match) => ({
      rule,
      line: lineOf(clean, match.index),
      excerpt: match[0].slice(0, EXCERPT_MAX),
    })),
  ).sort((a, b) => a.line - b.line);
}
