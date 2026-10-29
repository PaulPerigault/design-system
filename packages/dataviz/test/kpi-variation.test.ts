import { describe, expect, it } from 'vitest';
import { directionOf, variation } from '../src/domain/kpi/variation.ts';

describe('variation', () => {
  it('hausse : absolue et relative', () => {
    expect(variation(110, 100)).toEqual({
      ok: true,
      value: { direction: 'up', absolute: 10, relative: 0.1 },
    });
  });

  it('baisse et stabilité', () => {
    const down = variation(75, 100);
    expect(down.ok && down.value).toEqual({ direction: 'down', absolute: -25, relative: -0.25 });
    const flat = variation(5, 5);
    expect(flat.ok && flat.value).toEqual({ direction: 'flat', absolute: 0, relative: 0 });
  });

  it('référence absente : pas de variation, sans erreur', () => {
    expect(variation(42, null)).toEqual({ ok: true, value: null });
  });

  it('référence nulle : variation absolue, relative indéfinie, sans division par zéro', () => {
    const result = variation(8, 0);
    expect(result.ok && result.value).toEqual({ direction: 'up', absolute: 8, relative: null });
  });

  it('référence négative : le sens suit la variation absolue', () => {
    const result = variation(-50, -100);
    expect(result.ok && result.value).toEqual({ direction: 'up', absolute: 50, relative: 0.5 });
  });

  it('refuse un nombre non fini, avec un conseil', () => {
    const value = variation(Number.NaN, 1);
    expect(!value.ok && value.error.code).toBe('kpi.bad-value');
    const reference = variation(1, Number.POSITIVE_INFINITY);
    expect(!reference.ok && reference.error.code).toBe('kpi.bad-reference');
    expect(!reference.ok && reference.error.message).toContain('null');
  });

  it('directionOf', () => {
    expect([directionOf(1), directionOf(-1), directionOf(0)]).toEqual(['up', 'down', 'flat']);
  });
});
