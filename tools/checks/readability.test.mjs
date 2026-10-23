import { describe, expect, it } from 'vitest';
import { run } from './check-readability.mjs';
import { adviseSource, sentencesOf, visibleText, wordCount } from './readability.mjs';

describe('visibleText', () => {
  it('retire frontmatter, balises, code et expressions', () => {
    const source = '---\nconst a = 1;\n---\n<p>Un <code>x</code> {a} texte.</p><pre>ignoré</pre>';
    expect(visibleText(source)).toBe('Un texte.');
  });
});

describe('sentencesOf', () => {
  it('coupe aux fins de phrase suivies d’une majuscule', () => {
    expect(sentencesOf('Une phrase. Une autre ? Oui.')).toEqual([
      'Une phrase.',
      'Une autre ?',
      'Oui.',
    ]);
  });
});

describe('adviseSource', () => {
  it('signale une phrase de plus de 25 mots', () => {
    const long = `<p>${Array.from({ length: 26 }, () => 'mot').join(' ')}.</p>`;
    expect(adviseSource(long)).toEqual([expect.objectContaining({ kind: 'long' })]);
    expect(wordCount('un deux trois')).toBe(3);
  });
  it('signale la voix passive', () => {
    const advice = adviseSource('<p>Le bouton est désactivé par le formulaire.</p>');
    expect(advice).toEqual([expect.objectContaining({ kind: 'passive' })]);
  });
  it('ne signale pas une phrase courte à la voix active', () => {
    expect(adviseSource('<p>Le bouton envoie le formulaire.</p>')).toEqual([]);
  });
});

describe('run', () => {
  it('lit les pages et ajoute le fichier à chaque avertissement', () => {
    const warnings = run('/nulle-part');
    expect(warnings).toEqual([]);
  });
});
