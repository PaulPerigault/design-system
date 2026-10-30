// Texte : distance d'édition, suggestions, normalisation et termes de recherche, communs aux
// outils de composants, de jetons et de recherche.
import { ToolError } from '../errors.ts';

const SUGGESTIONS = 3;
const MAX_DISTANCE = 3;

/** Distance d'édition de Levenshtein (deux lignes). */
export function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const best = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
      current[j] = best;
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** Candidats proches de `name` (inclusion ou distance ≤ 3), les plus proches d'abord. */
export function closest(name: string, candidates: string[], count = SUGGESTIONS): string[] {
  return candidates
    .map((candidate) => ({
      candidate,
      score: candidate.includes(name) || name.includes(candidate) ? 0 : distance(name, candidate),
    }))
    .filter(({ score }) => score <= MAX_DISTANCE)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate, 'en'))
    .slice(0, count)
    .map(({ candidate }) => candidate);
}

const MIN_TERM = 2;

/** Minuscules, sans accents (NFD puis retrait des diacritiques). */
export const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function termsOf(query: string): string[] {
  const words = normalize(query)
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((word) => word.length >= MIN_TERM);
  if (words.length === 0)
    throw new ToolError('requête trop courte (un mot de 2 lettres).', 'input.query-short');
  return [...new Set(words)];
}
