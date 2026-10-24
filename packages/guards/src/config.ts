// Configuration de pp-guards : lecture de pp-guards.config.json et fusion des options.
import { GuardUsageError } from './lib/report.ts';

export const CONFIG_FILE = 'pp-guards.config.json';

function parseConfig(text: string, path: string): Record<string, Record<string, unknown>> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new GuardUsageError(`${path} : JSON invalide (${message})`);
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new GuardUsageError(`${path} : un objet JSON est attendu`);
  }
  return data as Record<string, Record<string, unknown>>;
}

export function loadConfig(io: import('./lib/io.ts').GuardIo, path?: string): Record<string, Record<string, unknown>> {
  if (path !== undefined && !io.exists(path)) {
    throw new GuardUsageError(`configuration introuvable : ${path}`);
  }
  const file = path ?? CONFIG_FILE;
  return io.exists(file) ? parseConfig(io.readText(file), file) : {};
}

export function mergeOptions(
  defaults: Record<string, unknown>,
  section: Record<string, unknown> | undefined,
  flags: Record<string, unknown>,
  positionals: string[],
): Record<string, unknown> {
  const merged = { ...defaults, ...section, ...flags };
  return positionals.length > 0 ? { ...merged, roots: [...positionals] } : merged;
}
