import { describe, expect, it } from 'vitest';
import { dataBlock } from '../src/content/milestones-3d-data';
import { formatDate } from '../src/content/milestones-3d-model';
import { FILES, known, read, strip } from './milestones-3d-css-helpers';

describe.each(FILES)('%s', (name) => {
  const css = strip(read(name));

  it('ne référence que des jetons --pp-* existants', () => {
    const used = [...css.matchAll(/var\(\s*(--pp-[\w-]+)/g)].map((match) => match[1] ?? '');
    expect(used.length).toBeGreaterThan(0);
    for (const token of used) expect(known.has(token), token).toBe(true);
  });

  it('ne contient aucune couleur, taille en px ni durée en dur', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i);
    expect(css).not.toMatch(/(?<![\w.-])[1-9]\d*(?:\.\d+)?(?:px|ms|s)\b/);
  });

  it('n’utilise que des propriétés logiques', () => {
    expect(css).not.toMatch(
      /(?:margin|padding|border)-(?:left|right|top|bottom)\b|(?<![\w-])(?:left|right|top|bottom|width|height)\s*:/,
    );
  });

  it('ne pose ni ombre, ni dégradé, ni flou, ni animation', () => {
    expect(css).not.toMatch(
      /box-shadow|text-shadow|gradient|backdrop-filter|filter:|animation|transition/,
    );
  });
});

describe('formatDate et dataBlock', () => {
  it('formate un mois et un jour dans la langue demandée', () => {
    expect(formatDate('2025-03', 'fr')).toEqual({
      text: 'mars 2025',
      short: 'mars 2025',
      datetime: '2025-03',
    });
    expect(formatDate('2025-09-05', 'fr').short).toBe('sept. 2025');
    expect(formatDate('2025-03-05', 'en').text).toBe('March 5, 2025');
  });

  it('rend le texte brut sans datetime pour une date inexistante ou mal formée', () => {
    for (const bad of ['2025-13', '2025-00', '2025-04-31', '2025-4', 'hier'])
      expect(formatDate(bad, 'fr')).toEqual({ text: bad, short: bad });
  });

  it('ne dérive pas d’un jour au changement d’année (fuseau UTC)', () => {
    expect(formatDate('2025-01-01', 'fr').text).toBe('1 janvier 2025');
    expect(formatDate('2024-12-31', 'fr').text).toBe('31 décembre 2024');
  });

  it('sérialise sans cible quand elle est absente', () => {
    expect(JSON.parse(dataBlock([]))).toEqual({ milestones: [] });
  });
});
