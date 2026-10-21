// Assembleur du registre : logique pure (lecture injectée), utilisée par build.mjs et ses tests.

const TOKEN = /--pp-[a-z0-9-]*[a-z0-9]/g;
const ASTRO_EXPORT = /^\.\/[A-Za-z]+\.astro$/;

export const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';

/**
 * Noms de tokens de `tokens.json` : valeurs de base et rôles de chaque thème (couleurs).
 * @param {{ base: object, themes: Record<string, object> }} json
 * @returns {Set<string>}
 */
export const knownTokens = ({ base, themes }) =>
  new Set([...Object.keys(base), ...Object.values(themes).flatMap((theme) => Object.keys(theme))]);

/**
 * Tokens réellement utilisés par les fichiers d'un élément : tout nom `--pp-*` présent dans
 * `tokens.json` (référence `var()` ou lecture par nom). Les propriétés locales sont écartées.
 * @param {string[]} texts contenus des fichiers
 * @param {Set<string>} known noms de `tokens.json`
 * @returns {string[]} triés
 */
export function tokensOf(texts, known) {
  const used = new Set(texts.flatMap((text) => text.match(TOKEN) ?? []));
  return [...used].filter((name) => known.has(name)).sort();
}

/**
 * Élément avec `meta.tokens` recalculé ; lève si un fichier déclaré n'existe pas.
 * @param {{ files: { path: string }[], meta?: object }} item
 * @param {{ read: (path: string) => string | undefined, known: Set<string> }} deps
 */
export function withTokens(item, { read, known }) {
  const texts = item.files.map(({ path }) => {
    const text = read(path);
    if (text === undefined) throw new Error(`${item.name} : fichier absent ${path}`);
    return text;
  });
  return { ...item, meta: { ...item.meta, tokens: tokensOf(texts, known) } };
}

/**
 * Exports `.astro` du paquet sans élément de registre qui contienne leur fichier.
 * @param {Record<string, string>} exports `exports` de packages/astro/package.json
 * @param {{ files: { path: string }[] }[]} items
 * @param {string} prefix chemin du paquet depuis la racine (`packages/astro/`)
 * @returns {string[]}
 */
export function uncovered(exports, items, prefix) {
  const paths = new Set(items.flatMap((item) => item.files.map((file) => file.path)));
  return Object.entries(exports)
    .filter(([key]) => ASTRO_EXPORT.test(key))
    .filter(([, target]) => !paths.has(`${prefix}${target.replace(/^\.\//, '')}`))
    .map(([key]) => key);
}

/**
 * Index `registry.json` (schéma shadcn) : éléments triés par nom, sans leur `$schema`.
 * @param {{ name: string, $schema?: string }[]} items
 * @param {{ name: string, homepage: string }} identity
 */
export function registryIndex(items, { name, homepage }) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return {
    $schema: REGISTRY_SCHEMA,
    name,
    homepage,
    items: sorted.map((item) => {
      const entry = { ...item };
      delete entry.$schema;
      return entry;
    }),
  };
}
