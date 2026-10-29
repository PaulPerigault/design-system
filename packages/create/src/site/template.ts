import { posix } from 'node:path';
import type { CreateIo } from '../lib/io.ts';
import { resolveIn } from '../lib/io.ts';
import { isStringRecord } from '../lib/json.ts';

const SITE_DIR = 'site';
const VERSIONS_FILE = 'versions.json';
const DOT_PREFIX = '_';

/** `path` : chemin relatif au gabarit. */
export interface TemplateFile {
  path: string;
  content: string;
}

export interface SiteTemplate {
  files: TemplateFile[];
  versions: Record<string, string>;
}

/**
 * Chemin écrit d'un fichier du gabarit : un segment commençant par `_` prend un `.`
 * (`npm pack` écarte `.gitignore` et `.npmrc`, d'où ce codage). `templatePath` : POSIX relatif.
 */
export function outputPath(templatePath: string): string {
  return templatePath
    .split('/')
    .map((segment) => (segment.startsWith(DOT_PREFIX) ? `.${segment.slice(1)}` : segment))
    .join('/');
}

/** Fichiers d'un dossier absolu, récursivement, relatifs à `dir`. */
function listFiles(io: Pick<CreateIo, 'readdir'>, dir: string): string[] {
  const entries = io.readdir(dir).filter((entry) => !entry.name.startsWith('.'));
  return entries.flatMap((entry) => {
    if (!entry.isDirectory()) return [entry.name];
    return listFiles(io, posix.join(dir, entry.name)).map((rel) => `${entry.name}/${rel}`);
  });
}

/** `versions.json` validé à la frontière : un objet de chaînes. */
function parseVersions(text: string): Record<string, string> {
  const data: unknown = JSON.parse(text);
  if (!isStringRecord(data)) {
    throw new Error(`${VERSIONS_FILE} : un objet nom → version (chaînes) est attendu`);
  }
  return data;
}

/** Lit `templates/site/**` et `templates/versions.json` (lecture seule). */
export function loadTemplate(
  readIo: Pick<CreateIo, 'cwd' | 'readText' | 'readdir'>,
  templatesRoot: string,
): SiteTemplate {
  const root = resolveIn(readIo, templatesRoot);
  const siteRoot = posix.join(root, SITE_DIR);
  const files = listFiles(readIo, siteRoot)
    .sort((a, b) => (a < b ? -1 : Number(a > b)))
    .map((path) => ({ path, content: readIo.readText(posix.join(siteRoot, path)) }));
  const versions = parseVersions(readIo.readText(posix.join(root, VERSIONS_FILE)));
  return { files, versions };
}
