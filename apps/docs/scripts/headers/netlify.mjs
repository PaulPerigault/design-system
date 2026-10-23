/** @typedef {import('./policy.mjs').HeaderRule} HeaderRule */
/** @typedef {import('./policy.mjs').Redirect} Redirect */

/**
 * Chaîne TOML de base. Les échappements JSON (`\"`, `\\`, `\n`, `\uXXXX`) sont valides en TOML.
 * @param {string} value
 * @returns {string}
 */
function toml(value) {
  return JSON.stringify(value);
}

/** @param {HeaderRule} rule */
function headerBlock({ path, headers }) {
  const values = headers.map(([name, value]) => `${toml(name)} = ${toml(value)}`);
  return [
    '[[headers]]',
    `  for = ${toml(path)}`,
    '  [headers.values]',
    ...values.map((l) => `    ${l}`),
  ].join('\n');
}

/** @param {Redirect} redirect */
function redirectBlock({ from, to, status }) {
  return [
    '[[redirects]]',
    `  from = ${toml(from)}`,
    `  to = ${toml(to)}`,
    `  status = ${status}`,
    '  force = true',
  ].join('\n');
}

/**
 * Contenu de `netlify.toml`.
 * @param {HeaderRule[]} rules
 * @param {Redirect[]} redirects
 * @returns {string}
 */
export function render(rules, redirects) {
  const blocks = [...rules.map(headerBlock), ...redirects.map(redirectBlock)];
  return `${blocks.join('\n\n')}\n`;
}
