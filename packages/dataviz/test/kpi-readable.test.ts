import { describe, expect, it } from 'vitest';
import { MAX_INTEGER_DIGITS, checkReadable } from '../src/domain/kpi/readable.ts';

describe('borne de lisibilité', () => {
  it('accepte jusqu’à 9 chiffres entiers, y compris négatifs et décimaux', () => {
    expect(MAX_INTEGER_DIGITS).toBe(9);
    expect(checkReadable(999_999_999.99)).toEqual({ ok: true, value: 999_999_999.99 });
    expect(checkReadable(-999_999_999).ok).toBe(true);
    expect(checkReadable(0).ok).toBe(true);
  });

  it('refuse au-delà, avec un conseil et le chemin', () => {
    const result = checkReadable(1_000_000_000, 'variation');
    expect(!result.ok && result.error.code).toBe('kpi.unreadable');
    expect(!result.ok && result.error.path).toBe('variation');
    expect(!result.ok && result.error.message).toContain('k€');
    expect(checkReadable(-1e21).ok).toBe(false);
  });

  it('refuse un nombre non fini', () => {
    const result = checkReadable(Number.NaN);
    expect(!result.ok && result.error.code).toBe('kpi.bad-value');
  });
});
