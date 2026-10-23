/** @typedef {import('./policy.mjs').HeaderRule} HeaderRule */
/** @typedef {import('./policy.mjs').Redirect} Redirect */

/**
 * Format `_headers` de Cloudflare Pages : chemin, puis `  Nom: valeur`, ligne vide entre règles.
 * @param {HeaderRule[]} rules
 * @returns {string}
 */
export function renderHeaders(rules) {
  const blocks = rules.map(({ path, headers }) =>
    [path, ...headers.map(([name, value]) => `  ${name}: ${value}`)].join('\n'),
  );
  return `${blocks.join('\n\n')}\n`;
}

/**
 * Format `_redirects` : `/de /vers statut`.
 * @param {Redirect[]} redirects
 * @returns {string}
 */
export function renderRedirects(redirects) {
  return `${redirects.map(({ from, to, status }) => `${from} ${to} ${status}`).join('\n')}\n`;
}
