const ID_DIGITS: Record<string, number> = { ADR: 4, D: 3 };

/** `adr-3` → `ADR-0003` ; `d-21` → `D-021`. */
export function canonicalId(id: string): string {
  const [kind = '', number = ''] = id.toUpperCase().split('-');
  return `${kind}-${number.padStart(ID_DIGITS[kind] ?? 0, '0')}`;
}
