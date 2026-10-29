import { describe, expect, it } from 'vitest';
import type { Formatter } from '../src/application/ports.ts';
import { variation } from '../src/domain/kpi/variation.ts';
import { variationText } from '../src/domain/kpi/words.ts';
import { createFormatter } from '../src/infrastructure/intl-formatter.ts';

const formatter = (locale = 'fr'): Formatter => {
  const result = createFormatter(locale);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const nb = (text: string): string => text.replace(/ ([€%])/g, ' $1');
const textOf = (value: number, reference: number, unit = '€', locale = 'fr') => {
  const change = variation(value, reference);
  if (!change.ok || change.value === null) throw new Error('variation attendue');
  return variationText(change.value, unit, formatter(locale));
};

describe('variation en mots', () => {
  it('hausse : signe, mots et pourcentage', () => {
    const result = textOf(104.2, 100);
    expect(result.ok && result.value.sentence).toBe(nb('hausse de 4,2 %'));
    expect(result.ok && result.value.relative).toBe(nb('+4,2 %'));
    expect(result.ok && result.value.absolute).toBe(nb('+4,2 €'));
  });

  it('baisse : vrai signe moins', () => {
    const result = textOf(90, 100);
    expect(result.ok && result.value.absolute).toBe(nb('−10 €'));
    expect(result.ok && result.value.sentence).toBe(nb('baisse de 10 %'));
  });

  it('stable, et quasi stable quand l’arrondi écrase la variation', () => {
    expect(textOf(5, 5)).toMatchObject({
      ok: true,
      value: { sentence: 'stable', absolute: nb('0 €') },
    });
    const tiny = textOf(100.0001, 100);
    expect(tiny.ok && tiny.value.sentence).toBe('quasi stable');
  });

  it('référence nulle : la phrase donne l’absolue, la relative manque', () => {
    const result = textOf(8, 0);
    expect(result.ok && result.value.relative).toBeNull();
    expect(result.ok && result.value.sentence).toBe(nb('hausse de 8 €'));
  });

  it('langue sans vocabulaire : format.bad-locale, avec conseil', () => {
    const result = textOf(10, 5, '€', 'en');
    expect(!result.ok && result.error.code).toBe('format.bad-locale');
    expect(!result.ok && result.error.message).toContain('fr');
  });
});
