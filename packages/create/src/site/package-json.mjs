const DEPENDENCIES = ['@paulperigault/css', 'astro'];
const DEV_DEPENDENCIES = [
  '@commitlint/cli',
  '@commitlint/config-conventional',
  '@paulperigault/guards',
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
 * sans `.` ni `_` en tête (refusés par npm).
 * @param {string} dir nom du dossier (dernier segment)
 * @returns {string}
 */
export function npmName(dir) {
  const name = dir.toLowerCase().replace(INVALID_CHARS, '-').replace(LEADING_DOTS, '');
  return name === '' ? FALLBACK_NAME : name;
}

/**
 * @param {Record<string, string>} versions
 * @param {string[]} names
 * @returns {Record<string, string>}
 */
function exactVersions(versions, names) {
  return Object.fromEntries(
    names.map((name) => {
      const version = versions[name];
      if (typeof version !== 'string' || !EXACT_VERSION.test(version)) {
        throw new Error(`versions.json : version exacte attendue pour ${name} (reçu ${version})`);
      }
      return [name, version];
    }),
  );
}

/**
 * `package.json` du site généré (texte JSON, 2 espaces, saut de ligne final).
 * @param {string} name nom du dossier ou nom npm
 * @param {Record<string, string>} versions versions exactes (`templates/versions.json`)
 * @returns {string}
 */
export function sitePackageJson(name, versions) {
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
