/** @typedef {import('./policy.mjs').HeaderRule} HeaderRule */
/** @typedef {import('./policy.mjs').Redirect} Redirect */

const WILDCARD_SUFFIX = '/*';

/**
 * Syntaxe `path-to-regexp` de Vercel : `/*` → `/(.*)`, `/_astro/*` → `/_astro/(.*)`.
 * @param {string} path
 * @returns {string}
 */
function toSource(path) {
  return path.endsWith(WILDCARD_SUFFIX) ? `${path.slice(0, -1)}(.*)` : path;
}

/**
 * Objet `vercel.json` sérialisable.
 * @param {HeaderRule[]} rules
 * @param {Redirect[]} redirects
 */
export function render(rules, redirects) {
  return {
    headers: rules.map(({ path, headers }) => ({
      source: toSource(path),
      headers: headers.map(([key, value]) => ({ key, value })),
    })),
    redirects: redirects.map(({ from, to, status }) => ({
      source: from,
      destination: to,
      statusCode: status,
    })),
    trailingSlash: true,
    cleanUrls: false,
  };
}
