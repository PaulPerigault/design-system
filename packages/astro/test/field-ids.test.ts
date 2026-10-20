import { describe, expect, it } from 'vitest';
import { describedBy, fieldIds } from '../src/forms/field-ids';

describe('fieldIds', () => {
  it('dérive les ids de l’indication et de l’erreur', () => {
    expect(fieldIds('email')).toEqual({ hint: 'email-hint', error: 'email-error' });
  });
});

describe('describedBy', () => {
  it('renvoie undefined sans indication ni erreur', () => {
    expect(describedBy({ id: 'email' })).toBeUndefined();
  });

  it('ignore les textes vides', () => {
    expect(describedBy({ id: 'email', hint: '', error: '' })).toBeUndefined();
  });

  it('renvoie l’id de l’indication seule', () => {
    expect(describedBy({ id: 'email', hint: 'Adresse professionnelle' })).toBe('email-hint');
  });

  it('renvoie l’id de l’erreur seule', () => {
    expect(describedBy({ id: 'email', error: 'Adresse invalide' })).toBe('email-error');
  });

  it('renvoie l’indication puis l’erreur', () => {
    expect(describedBy({ id: 'email', hint: 'h', error: 'e' })).toBe('email-hint email-error');
  });
});
