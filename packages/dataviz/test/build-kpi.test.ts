import { describe, expect, it } from 'vitest';
import { buildKpi } from '../src/application/build-kpi.ts';
import type { Formatter } from '../src/application/ports.ts';
import { createFormatter } from '../src/infrastructure/intl-formatter.ts';

const formatter = (locale: string): Formatter => {
  const result = createFormatter(locale);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};
const NBSP = String.fromCodePoint(0xa0);
const nb = (text: string): string => text.replace(/ ([€%])/g, `${NBSP}$1`);

describe('buildKpi', () => {
  it('valeur, unité, variation et phrase de lecture', () => {
    const result = buildKpi({ value: 1234.5, unit: '€', reference: 1185 }, formatter('fr'));
    const thousands = String.fromCodePoint(0x202f);
    expect(result.ok && result.value.summary).toBe(
      `1${thousands}234,5${NBSP}€, ${nb('hausse de 4,18 %')}`,
    );
  });

  it('sans référence : valeur seule', () => {
    const result = buildKpi({ value: 42, unit: '%' }, formatter('fr'));
    expect(result.ok && result.value).toMatchObject({ variation: null, summary: nb('42 %') });
  });

  it('référence nulle : variation relative absente, absolue présente', () => {
    const result = buildKpi({ value: 8, reference: 0 }, formatter('fr'));
    expect(result.ok && result.value.variation?.relative).toBeNull();
    expect(result.ok && result.value.variation?.sentence).toBe('hausse de 8');
  });

  it('la locale vient du paramètre, jamais de la locale du build', () => {
    const fr = buildKpi({ value: 1234.5 }, formatter('fr'));
    const de = buildKpi({ value: 1234.5 }, formatter('de'));
    expect(fr.ok && fr.value.valueText).toContain(',5');
    expect(de.ok && de.value.valueText).toBe('1.234,5');
  });

  it.each([
    ['valeur non finie', { value: Number.NaN }, 'kpi.bad-value'],
    ['référence non finie', { value: 1, reference: Number.NaN }, 'kpi.bad-reference'],
    ['valeur trop grande', { value: 1e9 }, 'kpi.unreadable'],
    ['variation trop grande', { value: 9e8, reference: -9e8 }, 'kpi.unreadable'],
  ])('%s → %s', (_name, input, code) => {
    const result = buildKpi(input, formatter('fr'));
    expect(!result.ok && result.error.code).toBe(code);
    expect(!result.ok && result.error.message.length).toBeGreaterThan(20);
  });

  it('locale sans vocabulaire : format.bad-locale', () => {
    const result = buildKpi({ value: 2, reference: 1 }, formatter('en'));
    expect(!result.ok && result.error.code).toBe('format.bad-locale');
  });
});
