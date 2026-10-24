// Budget de poids par fichier image : l'entrée `budgets` au chemin le plus long l'emporte.
import { matchesPath, normalizePath } from '../lib/paths.ts';
import { GuardUsageError } from '../lib/report.ts';

export const BUDGET_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'];
export const BYTES_PER_KB = 1024;

/**
 * Nombre de Ko strictement positif ; accepte une chaîne venue de la ligne de commande.
 * @param {unknown} value
 * @param {string} label nom de l'option, pour le message d'erreur
 * @returns {number}
 */
export function toKb(value, label) {
  const kb = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof kb !== 'number' || !Number.isFinite(kb) || kb <= 0) {
    throw new GuardUsageError(`${label} doit être un nombre de Ko positif (reçu : ${value})`);
  }
  return kb;
}

/** @param {unknown} raw liste, ou JSON venu de la ligne de commande */
function parseBudgets(raw) {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    throw new GuardUsageError('budgets : JSON invalide, attendu [{ "path": "…", "maxKb": 400 }]');
  }
}

/** @param {{ path?: unknown, maxKb?: unknown }} entry @param {number} index */
function budgetEntry(entry, index) {
  const path = typeof entry?.path === 'string' ? normalizePath(entry.path) : '';
  if (path === '') throw new GuardUsageError(`budgets[${index}].path manquant`);
  return { path, maxKb: toKb(entry.maxKb, `budgets[${index}].maxKb`) };
}

/**
 * @typedef {{ maxKb: number, budgets: { path: string, maxKb: number }[] }} BudgetSettings
 * @param {{ maxKb: unknown, budgets: unknown }} options
 * @returns {BudgetSettings}
 */
export function budgetSettings({ maxKb, budgets }) {
  const list = parseBudgets(budgets ?? []);
  if (!Array.isArray(list)) {
    throw new GuardUsageError('budgets doit être une liste [{ path, maxKb }]');
  }
  return { maxKb: toKb(maxKb, 'maxKb'), budgets: list.map(budgetEntry) };
}

/**
 * Budget applicable à `file`, en Ko.
 * @param {string} file
 * @param {BudgetSettings} settings
 * @returns {number}
 */
export function budgetFor(file, { maxKb, budgets }) {
  let best = null;
  for (const entry of budgets) {
    const longer = best === null || entry.path.length > best.path.length;
    if (longer && matchesPath(file, entry.path)) best = entry;
  }
  return best === null ? maxKb : best.maxKb;
}

/**
 * @param {import('../lib/io.ts').GuardIo} io
 * @param {string[]} files images visées
 * @param {BudgetSettings} settings
 * @returns {import('../lib/report.ts').Problem[]}
 */
export function budgetProblems(io, files, settings) {
  return files.flatMap((file) => {
    const max = budgetFor(file, settings);
    const size = io.size(file);
    if (size <= max * BYTES_PER_KB) return [];
    return [{ file, message: `${Math.ceil(size / BYTES_PER_KB)} Ko > budget ${max} Ko` }];
  });
}
