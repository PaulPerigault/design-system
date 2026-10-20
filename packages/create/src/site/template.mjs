import { posix } from 'node:path';
import { resolveIn } from '../lib/io.mjs';

const SITE_DIR = 'site';
const VERSIONS_FILE = 'versions.json';
const DOT_PREFIX = '_';

/**
 * @typedef {{ path: string, content: string }} TemplateFile chemin relatif au gabarit
 * @typedef {{ files: TemplateFile[], versions: Record<string, string> }} SiteTemplate
 */

/**
 * Chemin écrit d'un fichier du gabarit : un segment commençant par `_` prend un `.`
 * (`npm pack` écarte `.gitignore` et `.npmrc`, d'où ce codage).
 * @param {string} templatePath chemin POSIX relatif
 * @returns {string}
 */
export function outputPath(templatePath) {
  return templatePath
    .split('/')
    .map((segment) => (segment.startsWith(DOT_PREFIX) ? `.${segment.slice(1)}` : segment))
    .join('/');
}

/**
 * Fichiers d'un dossier, récursivement, relatifs à `dir`.
 * @param {Pick<import('../lib/io.mjs').CreateIo, 'readdir'>} io
 * @param {string} dir absolu
 * @returns {string[]}
 */
function listFiles(io, dir) {
  const entries = io.readdir(dir).filter((entry) => !entry.name.startsWith('.'));
  return entries.flatMap((entry) => {
    if (!entry.isDirectory()) return [entry.name];
    return listFiles(io, posix.join(dir, entry.name)).map((rel) => `${entry.name}/${rel}`);
  });
}

/**
 * Lit `templates/site/**` et `templates/versions.json` (lecture seule).
 * @param {Pick<import('../lib/io.mjs').CreateIo, 'cwd' | 'readText' | 'readdir'>} readIo
 * @param {string} templatesRoot racine `templates/` du paquet
 * @returns {SiteTemplate}
 */
export function loadTemplate(readIo, templatesRoot) {
  const root = resolveIn(readIo, templatesRoot);
  const siteRoot = posix.join(root, SITE_DIR);
  const files = listFiles(readIo, siteRoot)
    .sort((a, b) => (a < b ? -1 : Number(a > b)))
    .map((path) => ({ path, content: readIo.readText(posix.join(siteRoot, path)) }));
  const versions = JSON.parse(readIo.readText(posix.join(root, VERSIONS_FILE)));
  return { files, versions };
}
