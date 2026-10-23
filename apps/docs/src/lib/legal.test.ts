import { describe, expect, it } from 'vitest';
import { LEGAL, assertProductionReady, legalProblems } from './legal.ts';
import type { Legal } from './legal.ts';

const COMPLETE: Legal = {
  publisher: 'Paul Périgault',
  host: 'Hébergeur exemple, 1 rue Exemple',
  contact: 'contact@exemple.test',
  licenseCode: 'MIT',
  licenseContent: 'CC BY 4.0',
};

describe('legalProblems', () => {
  it('liste les champs vides de la configuration par défaut', () => {
    expect(legalProblems(LEGAL)).toEqual(['host', 'contact', 'licenseContent']);
  });

  it('renvoie une liste vide quand tous les champs sont renseignés', () => {
    expect(legalProblems(COMPLETE)).toEqual([]);
  });

  it('traite un champ fait d’espaces comme vide', () => {
    expect(legalProblems({ ...COMPLETE, contact: '   ' })).toEqual(['contact']);
  });
});

describe('assertProductionReady', () => {
  it('ne lève rien hors production, même si l’hébergeur est vide', () => {
    expect(() => assertProductionReady(LEGAL, {})).not.toThrow();
    expect(() => assertProductionReady(LEGAL, { PP_PRODUCTION: '0' })).not.toThrow();
  });

  it('lève une erreur en production si l’hébergeur est vide', () => {
    const legal = { ...COMPLETE, host: '' };
    expect(() => assertProductionReady(legal, { PP_PRODUCTION: '1' })).toThrow(/host/);
  });

  it('lève une erreur en production si le contact est vide', () => {
    const legal = { ...COMPLETE, contact: '' };
    expect(() => assertProductionReady(legal, { PP_PRODUCTION: '1' })).toThrow(/contact/);
  });

  it('passe en production quand hébergeur et contact sont renseignés', () => {
    expect(() => assertProductionReady(COMPLETE, { PP_PRODUCTION: '1' })).not.toThrow();
  });
});
