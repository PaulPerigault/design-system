import { describe, expect, it } from 'vitest';
import { GLOSSARY } from './glossary';
import type { Entry } from './glossary';

const MAX_WORDS_PER_SENTENCE = 25;

/** Découpe une définition en phrases, en coupant après un point suivi d'un espace. */
const sentencesOf = (text: string): string[] => text.split(/(?<=\.)\s+/).filter(Boolean);

const wordsOf = (sentence: string): string[] => sentence.split(/\s+/).filter(Boolean);

const pairs = (entries: readonly Entry[]): [Entry, Entry][] =>
  entries.slice(1).map((entry, index) => [entries[index] as Entry, entry]);

describe('GLOSSARY', () => {
  it('contient au moins 30 termes', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(30);
  });

  it('a des identifiants uniques', () => {
    const ids = GLOSSARY.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('est trié par terme selon localeCompare fr', () => {
    for (const [previous, current] of pairs(GLOSSARY)) {
      expect(previous.term.localeCompare(current.term, 'fr')).toBeLessThanOrEqual(0);
    }
  });

  it('n’a aucune définition vide ni terme vide', () => {
    for (const entry of GLOSSARY) {
      expect(entry.term.trim()).not.toBe('');
      expect(entry.definition.trim()).not.toBe('');
    }
  });

  it('limite chaque phrase de définition à 25 mots', () => {
    for (const entry of GLOSSARY) {
      for (const sentence of sentencesOf(entry.definition)) {
        expect(wordsOf(sentence).length, `${entry.id} : ${sentence}`).toBeLessThanOrEqual(
          MAX_WORDS_PER_SENTENCE,
        );
      }
    }
  });
});
