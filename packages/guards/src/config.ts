// Configuration de pp-guards : lecture de pp-guards.config.json et fusion des options.
import type { GuardIo } from './lib/io.ts';
import { isRecord } from './lib/options.ts';
import type { Options } from './lib/options.ts';
import { GuardUsageError } from './lib/report.ts';

export const CONFIG_FILE = 'pp-guards.config.json';

function sections(data: Record<string, unknown>, path: string): Record<string, Options> {
  return Object.fromEntries(
    Object.entries(data).map(([name, section]) => {
      if (isRecord(section)) return [name, section];
      throw new GuardUsageError(`${path} : la section « ${name} » doit être un objet`);
    }),
  );
}

function parseConfig(text: string, path: string): Record<string, Options> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new GuardUsageError(`${path} : JSON invalide (${message})`);
  }
  if (!isRecord(data)) {
    throw new GuardUsageError(`${path} : un objet JSON est attendu`);
  }
  return sections(data, path);
}

export function loadConfig(io: GuardIo, path?: string): Record<string, Options> {
  if (path !== undefined && !io.exists(path)) {
    throw new GuardUsageError(`configuration introuvable : ${path}`);
  }
  const file = path ?? CONFIG_FILE;
  return io.exists(file) ? parseConfig(io.readText(file), file) : {};
}

export function mergeOptions(
  defaults: Options,
  section: Options | undefined,
  flags: Options,
  positionals: string[],
): Options {
  const merged = { ...defaults, ...section, ...flags };
  return positionals.length > 0 ? { ...merged, roots: [...positionals] } : merged;
}
