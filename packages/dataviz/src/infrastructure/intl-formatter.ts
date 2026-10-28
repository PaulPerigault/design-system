import type { Formatter } from '../application/ports.ts';
import { parseIsoDate } from '../domain/iso-date.ts';
import type { Result } from '../domain/result.ts';
import { fail, ok } from '../domain/result.ts';

const DEFAULT_LOCALE = 'fr';
const MAX_FRACTION_DIGITS = 2;
const MONTH_PARTS = 2;
const NO_BREAK_SPACE = ' ';
const MISSING: Readonly<Record<string, string>> = { fr: 'donnée manquante' };
const MISSING_FALLBACK = 'n/a';
const ISO_DATE_ONLY = /^\d{4}(-\d{2}){0,2}$/;

function dateOptions(iso: string): Intl.DateTimeFormatOptions {
  const parts = iso.split('T')[0]?.split('-').length ?? 1;
  if (iso.includes('T')) {
    return { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC', hourCycle: 'h23' };
  }
  const base: Intl.DateTimeFormatOptions = { year: 'numeric', timeZone: 'UTC' };
  if (parts === 1) return base;
  return parts === MONTH_PARTS
    ? { ...base, month: 'long' }
    : { ...base, month: 'long', day: 'numeric' };
}

/** Formatage par `Intl` (locale `fr` par défaut), sans dépendance ; `format.bad-locale` sinon. */
export function createFormatter(locale = DEFAULT_LOCALE): Result<Formatter> {
  try {
    const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: MAX_FRACTION_DIGITS });
    const lang = locale.split('-')[0] ?? locale;
    return ok({
      locale,
      missing: MISSING[lang] ?? MISSING_FALLBACK,
      number: (value, unit = '') =>
        unit === '' ? numbers.format(value) : `${numbers.format(value)}${NO_BREAK_SPACE}${unit}`,
      dateLabel: (iso) => {
        const date = parseIsoDate(iso);
        if (!date.ok) return iso;
        const label = new Intl.DateTimeFormat(locale, dateOptions(iso)).format(date.value);
        return ISO_DATE_ONLY.test(iso) ? label : `${label} UTC`;
      },
    });
  } catch {
    return fail('format.bad-locale', `Locale « ${locale} » inconnue.`);
  }
}
