import { describe, expect, it } from 'vitest';
import { actionOf, categories, overlap } from './classify.mjs';
import { extractComments, nextCodeLine } from './extract.mjs';

const comment = (text, doc = false) => ({ text, doc });

describe('extractComments', () => {
  it('saute les chaînes et fusionne les lignes consécutives', () => {
    const source = 'const url = "https://x.fr"; // un\n// deux\nconst a = 1;\n';
    const found = extractComments(source, '.ts');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ line: 1, end: 2, text: 'un\ndeux' });
  });

  it('lit les commentaires CSS, Astro et YAML', () => {
    expect(extractComments('a { /* x */ }', '.css')[0].text).toBe('x');
    expect(extractComments('<!-- y -->', '.astro')[0].text).toBe('y');
    expect(extractComments('a: 1 # z\nb: "#no"\n', '.yml').map((c) => c.text)).toEqual(['z']);
  });

  it('donne la première ligne de code qui suit', () => {
    const source = '// c\n\nconst b = 2;\n';
    expect(nextCodeLine(source, extractComments(source, '.mjs')[0])).toBe('const b = 2;');
  });
});

describe('categories et actions', () => {
  it('reconnaît une décision, une référence, un TODO sans issue', () => {
    expect(categories(comment('Choix confirmé, voir #12'))).toContain('decision');
    expect(categories(comment('Voir D-101 et ADR-0006'))).toContain('reference');
    expect(categories(comment('TODO nettoyer'))).toContain('todo');
    expect(categories(comment('TODO nettoyer (#12)'))).not.toContain('todo');
  });

  it('reconnaît une paraphrase et une documentation redondante', () => {
    expect(overlap('retourne la valeur', 'return value')).toBeLessThan(1);
    expect(categories(comment('Le compteur'), 'compteur += 1')).toContain('paraphrase');
    expect(categories(comment('@param {string} nom', true))).toContain('doc-redondante');
  });

  it('choisit l’action', () => {
    expect(actionOf(['decoratif'], '----')).toBe('supprimer');
    expect(actionOf(['decision'], 'x')).toBe('reformuler');
    expect(actionOf([], 'Largeur en px (WCAG)')).toBe('garder-technique');
    expect(actionOf([], 'Somme des poids')).toBe('garder');
  });
});
