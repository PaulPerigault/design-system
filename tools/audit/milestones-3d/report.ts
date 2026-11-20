// Rapport de l'audit : tableau lisible par moteur et par contrôle, JSON pour les captures, code de
// sortie non nul si un contrôle échoue (les mesures `info` et les contrôles `skip` ne bloquent pas).
import type { Row, Status } from './model.ts';

const MARK: Record<Status, string> = { ok: 'OK  ', fail: 'ÉCHEC', skip: 'SAUT', info: 'MESURE' };
const COLUMNS = ['engine', 'scenario', 'check', 'status', 'detail'] as const;

export const failures = (rows: readonly Row[]): Row[] => rows.filter((r) => r.status === 'fail');

export const exitCode = (rows: readonly Row[]): 0 | 1 => (failures(rows).length === 0 ? 0 : 1);

function cells(r: Row): string[] {
  return [r.engine, r.scenario, r.check, MARK[r.status], r.detail];
}

export function formatTable(rows: readonly Row[]): string {
  const lines = rows.map(cells);
  const widths = COLUMNS.map((_, i) => Math.max(...lines.map((l) => (l[i] ?? '').length), 1));
  const pad = (l: string[]): string =>
    l.map((c, i) => (i === widths.length - 1 ? c : c.padEnd(widths[i] ?? 0))).join('  ');
  return lines.map(pad).join('\n');
}

export function summary(rows: readonly Row[]): string {
  const count = (status: Status): number => rows.filter((r) => r.status === status).length;
  return `${rows.length} lignes : ${count('ok')} ok, ${count('fail')} échec(s), ${count('skip')} saut(s), ${count('info')} mesure(s)`;
}
