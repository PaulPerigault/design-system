import { posix } from 'node:path';
import { resolveIn } from '../domain/paths.ts';
import { toVersions } from '../domain/template.ts';
import type { SiteTemplate } from '../domain/template.ts';
import type { CreateIo } from './ports.ts';

const SITE_DIR = 'site';
const VERSIONS_FILE = 'versions.json';

/** Fichiers d'un dossier absolu, récursivement, relatifs à `dir`. */
function listFiles(io: Pick<CreateIo, 'readdir'>, dir: string): string[] {
  const entries = io.readdir(dir).filter((entry) => !entry.name.startsWith('.'));
  return entries.flatMap((entry) => {
    if (!entry.isDirectory()) return [entry.name];
    return listFiles(io, posix.join(dir, entry.name)).map((rel) => `${entry.name}/${rel}`);
  });
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
  const versions = toVersions(JSON.parse(readIo.readText(posix.join(root, VERSIONS_FILE))));
  return { files, versions };
}
