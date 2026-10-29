import { describe, expect, it } from 'vitest';
import { isRecord, isStrings, listOption, nonEmptyListOption } from '../src/domain/options.ts';
import { GuardUsageError } from '../src/errors.ts';
import { validateOptions } from '../src/application/check-design.ts';

describe('gardes de type', () => {
  it('isRecord : objet simple seulement', () => {
    expect([{}, { a: 1 }].every(isRecord)).toBe(true);
    expect([null, [], 'a', 1, undefined].some(isRecord)).toBe(false);
  });

  it('isStrings : liste de chaînes seulement', () => {
    expect([[], ['a', 'b']].every(isStrings)).toBe(true);
    expect([['a', 1], 'a', undefined, null].some(isStrings)).toBe(false);
  });
});

describe('listOption', () => {
  it('rend la valeur, le repli si absente, et conserve une liste vide', () => {
    expect(listOption({ roots: ['a'] }, 'roots', ['x'])).toEqual(['a']);
    expect(listOption({}, 'roots', ['x'])).toEqual(['x']);
    expect(listOption({ roots: [] }, 'roots', ['x'])).toEqual([]);
  });

  it('refuse autre chose qu’une liste de chaînes', () => {
    expect(() => listOption({ roots: 'a' }, 'roots', [])).toThrow(GuardUsageError);
    expect(() => listOption({ roots: ['a', 1] }, 'roots', [])).toThrow(/roots/);
  });
});

describe('nonEmptyListOption', () => {
  it('une liste vide donne aussi le repli', () => {
    expect(nonEmptyListOption({ roots: [] }, 'roots', ['x'])).toEqual(['x']);
    expect(nonEmptyListOption({ roots: ['a'] }, 'roots', ['x'])).toEqual(['a']);
  });
});

describe('validateOptions (design)', () => {
  it('type allow et disable', () => {
    const settings = validateOptions({
      allow: ['a.css', { path: 'b', rules: ['gradient'] }, { path: 'c' }],
      disable: ['shadow'],
    });
    expect(settings).toEqual({
      allow: ['a.css', { path: 'b', rules: ['gradient'] }, { path: 'c' }],
      disable: ['shadow'],
    });
  });

  it.each([
    ['allow non liste', { allow: 'a' }],
    ['entrée sans path', { allow: [{ rules: [] }] }],
    ['entrée nulle', { allow: [null] }],
    ['rules non liste', { allow: [{ path: 'a', rules: 'x' }] }],
    ['disable non liste', { disable: 'shadow' }],
    ['règle inconnue', { disable: ['inconnue'] }],
    ['règle inconnue dans allow', { allow: [{ path: 'a', rules: ['inconnue'] }] }],
  ])('refuse : %s', (_label, options) => {
    expect(() => validateOptions(options)).toThrow(GuardUsageError);
  });
});
