import { describe, expect, it } from 'vitest';
import { bodyLineLength } from './body-line-length.mjs';

const long = 'x'.repeat(101);

describe('bodyLineLength', () => {
  it('accepte un corps de lignes courtes', () => {
    expect(bodyLineLength({ header: 'feat: a', body: 'court\nencore' })[0]).toBe(true);
  });

  it('refuse une ligne de plus de 100 caractères pour un commit humain', () => {
    expect(bodyLineLength({ header: 'feat: a', body: `ok\n${long}` })[0]).toBe(false);
  });

  it('compte les caractères et non les octets', () => {
    expect(bodyLineLength({ header: 'feat: a', body: 'é'.repeat(100) })[0]).toBe(true);
  });

  it('accepte les notes de version d’une montée Dependabot', () => {
    const header = 'chore(deps): bump hono from 1 to 2';
    expect(bodyLineLength({ header, body: long })[0]).toBe(true);
  });

  it('accepte le changelog généré par la PR de release-please', () => {
    expect(bodyLineLength({ header: 'chore: release main', body: long })[0]).toBe(true);
  });

  it('accepte le sujet de release avec le suffixe (#n) ajouté par la CI', () => {
    expect(bodyLineLength({ header: 'chore: release main (#370)', body: long })[0]).toBe(true);
  });

  it('applique la limite à un sujet de release qui n’est pas exact', () => {
    expect(bodyLineLength({ header: 'chore: release main now', body: long })[0]).toBe(false);
    expect(bodyLineLength({ header: 'chore: release main now (#370)', body: long })[0]).toBe(false);
    expect(bodyLineLength({ header: 'chore: release main (#x)', body: long })[0]).toBe(false);
  });

  it('applique la limite à un faux sujet de montée sans le préfixe exact', () => {
    expect(bodyLineLength({ header: 'chore: bump hono', body: long })[0]).toBe(false);
  });

  it('accepte un message sans corps', () => {
    expect(bodyLineLength({ header: 'fix: a', body: null })[0]).toBe(true);
  });
});
