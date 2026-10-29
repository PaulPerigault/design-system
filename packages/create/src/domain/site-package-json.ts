import { CreateError } from '../errors.ts';

// `tokens` : lu par pp-guards.config.json, donc direct (le hissage d'une dépendance transitive
// n'est pas garanti).
const DEPENDENCIES = ['@paulperigault/css', '@paulperigault/tokens', 'astro'];
const DEV_DEPENDENCIES = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  '@paulperigault/guards',
  '@paulperigault/mcp',
  'husky',
];
const SCRIPTS = {
  dev: 'astro dev',
  build: 'astro build',
  preview: 'astro preview',
  guard: 'pp-guards all',
  verify: 'npm run guard && astro build',
  prepare: 'husky',
};
const NODE_RANGE = '>=24';
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?$/i;
const INVALID_CHARS = /[^a-z0-9._-]/g;
const LEADING_DOTS = /^[._]+/;
const FALLBACK_NAME = 'site';
const INDENT = 2;

/**
 * Nom npm dérivé d'un nom de dossier : minuscules, caractères hors `[a-z0-9-._]` → `-`,
 * sans `.` ni `_` en tête (refusés par npm). `dir` : dernier segment du dossier.
 */
export function npmName(dir: string): string {
  const name = dir.toLowerCase().replace(INVALID_CHARS, '-').replace(LEADING_DOTS, '');
  return name === '' ? FALLBACK_NAME : name;
}

function exactVersions(versions: Record<string, string>, names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => {
      const version = versions[name];
      if (typeof version !== 'string' || !EXACT_VERSION.test(version)) {
        throw new CreateError(
          'site.version-invalid',
          `versions.json : version exacte attendue pour ${name} (reçu ${version})`,
          { name },
        );
      }
      return [name, version];
    }),
  );
}

/**
 * `package.json` du site généré (texte JSON, 2 espaces, saut de ligne final). `name` : nom du
 * dossier ou nom npm ; `versions` : versions exactes (`templates/versions.json`).
 */
export function sitePackageJson(name: string, versions: Record<string, string>): string {
  const manifest = {
    name: npmName(name),
    private: true,
    type: 'module',
    engines: { node: NODE_RANGE },
    scripts: SCRIPTS,
    dependencies: exactVersions(versions, DEPENDENCIES),
    devDependencies: exactVersions(versions, DEV_DEPENDENCIES),
  };
  return `${JSON.stringify(manifest, null, INDENT)}\n`;
}
