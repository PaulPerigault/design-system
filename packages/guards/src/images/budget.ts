// Budget de poids par fichier image : l'entrée `budgets` au chemin le plus long l'emporte.
import { matchesPath, normalizePath } from '../lib/paths.ts';
import { GuardUsageError } from '../lib/report.ts';

export const BUDGET_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];
export const BYTES_PER_KB = 1024;

export function toKb(value: unknown, label: string): number {
  const kb = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof kb !== 'number' || !Number.isFinite(kb) || kb <= 0) {
    throw new GuardUsageError(`${label} doit être un nombre de Ko positif (reçu : ${String(value)})`);
  }
  return kb;
}

function parseBudgets(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new GuardUsageError('budgets : JSON invalide, attendu [{ "path": "…", "maxKb": 400 }]');
  }
}

function budgetEntry(entry: unknown, index: number): { path: string; maxKb: number } {
  const e = entry as { path?: unknown; maxKb?: unknown };
  const path = typeof e?.path === 'string' ? normalizePath(e.path) : '';
  if (path === '') throw new GuardUsageError(`budgets[${index}].path manquant`);
  return { path, maxKb: toKb(e.maxKb, `budgets[${index}].maxKb`) };
}

interface BudgetSettings {
  maxKb: number;
  budgets: { path: string; maxKb: number }[];
}

export function budgetSettings(options: { maxKb: unknown; budgets: unknown }): BudgetSettings {
  const list = parseBudgets(options.budgets ?? []);
  if (!Array.isArray(list)) {
    throw new GuardUsageError('budgets doit être une liste [{ path, maxKb }]');
  }
  return { maxKb: toKb(options.maxKb, 'maxKb'), budgets: list.map(budgetEntry) };
}

export function budgetFor(file: string, { maxKb, budgets }: BudgetSettings): number {
  let best: { path: string; maxKb: number } | null = null;
  for (const entry of budgets) {
    const longer = best === null || entry.path.length > best.path.length;
    if (longer && matchesPath(file, entry.path)) best = entry;
  }
  return best === null ? maxKb : best.maxKb;
}

export function budgetProblems(io: import('../lib/io.ts').GuardIo, files: string[], settings: BudgetSettings): import('../lib/report.ts').Problem[] {
  return files.flatMap((file) => {
    const max = budgetFor(file, settings);
    const size = io.size(file);
    if (size <= max * BYTES_PER_KB) return [];
    return [{ file, message: `${Math.ceil(size / BYTES_PER_KB)} Ko > budget ${max} Ko` }];
  });
}
