import { describe, expect, it } from 'vitest';
import { PACKAGES, PACKAGE_COUNT, PACKAGE_COUNT_WORD } from './architecture.ts';

describe('paquets de la page architecture', () => {
  it('compte les neuf paquets d’AGENTS.md, application de documentation exclue', () => {
    expect(PACKAGE_COUNT).toBe(9);
    expect(PACKAGE_COUNT_WORD).toBe('neuf');
  });

  it('liste color et data avec leurs dépendances', () => {
    const names = PACKAGES.map(([name]) => name);
    expect(names).toContain('@paulperigault/color');
    expect(PACKAGES.find(([name]) => name === '@paulperigault/data')?.[2]).toBe('dataviz');
  });
});
