import { describe, expect, it } from 'vitest';
import { securityTxtProblems } from './check-security-txt.mjs';

const NOW = new Date('2026-10-23T00:00:00Z');
const file = (expires) => `Contact: https://exemple.test/signaler\nExpires: ${expires}\n`;

describe('security.txt', () => {
  it('accepte une échéance dans l’année', () => {
    expect(securityTxtProblems(file('2027-09-30T00:00:00.000Z'), NOW)).toEqual([]);
  });
  it('refuse une échéance dépassée, trop lointaine ou illisible', () => {
    expect(securityTxtProblems(file('2026-01-01T00:00:00Z'), NOW)).toEqual([
      'Expires est dépassé : renouveler le fichier',
    ]);
    expect(securityTxtProblems(file('2028-01-01T00:00:00Z'), NOW)).toEqual([
      'Expires dépasse un an (RFC 9116)',
    ]);
    expect(securityTxtProblems(file('demain'), NOW)).toEqual(['Expires illisible']);
  });
  it('exige Contact et Expires', () => {
    expect(securityTxtProblems('Policy: https://exemple.test\n', NOW)).toContain(
      'Contact manquant',
    );
  });
});
