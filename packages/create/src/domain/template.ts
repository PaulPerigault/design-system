import { CreateError } from '../errors.ts';
import { isStringRecord } from './json.ts';

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

/** `versions.json` validé à la frontière : un objet de chaînes. */
export function toVersions(data: unknown): Record<string, string> {
  if (!isStringRecord(data)) {
    throw new CreateError(
      'template.versions-invalid',
      `${VERSIONS_FILE} : un objet nom → version (chaînes) est attendu`,
    );
  }
  return data;
}
