import { describe, expect, it } from 'vitest';
import { STATEMENT, statementProblems } from './a11y-statement.ts';
import type { AccessibilityStatement } from './a11y-statement.ts';

const COMPLETE: AccessibilityStatement = {
  ...STATEMENT,
  date: '2026-01-15',
  contact: 'contact@exemple.test',
};

describe('statementProblems', () => {
  it('ne signale aucun champ vide dans la configuration publiée', () => {
    expect(statementProblems(STATEMENT)).toEqual([]);
  });

  it('signale un champ vidé', () => {
    expect(statementProblems({ ...STATEMENT, contact: '' })).toEqual(['contact']);
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
