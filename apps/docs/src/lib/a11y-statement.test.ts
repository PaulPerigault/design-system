import { describe, expect, it } from 'vitest';
import { STATEMENT, statementProblems } from './a11y-statement.ts';
import type { AccessibilityStatement } from './a11y-statement.ts';

const COMPLETE: AccessibilityStatement = {
  ...STATEMENT,
  date: '2026-01-15',
  contact: 'contact@exemple.test',
};

describe('statementProblems', () => {
  it('détecte les champs vides de la configuration par défaut', () => {
    expect(statementProblems(STATEMENT)).toEqual(['date', 'contact']);
  });

  it('accepte un champ rempli et ne le signale plus', () => {
    const statement = { ...STATEMENT, contact: 'contact@exemple.test' };
    expect(statementProblems(statement)).toEqual(['date']);
  });

  it('renvoie une liste vide quand tous les champs sont renseignés', () => {
    expect(statementProblems(COMPLETE)).toEqual([]);
  });

  it('traite un champ fait d’espaces comme vide', () => {
    expect(statementProblems({ ...COMPLETE, date: '   ' })).toEqual(['date']);
  });

  it('ne compte pas le taux nul comme un champ vide', () => {
    expect(statementProblems({ ...COMPLETE, rate: null })).toEqual([]);
  });
});
