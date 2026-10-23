/** @typedef {import('./policy.mjs').Header} Header */
/** @typedef {import('./policy.mjs').HeaderRule} HeaderRule */
/** @typedef {import('./policy.mjs').Redirect} Redirect */

const ROOT_PATH = '/*';
const INDENT = '  ';

/** @param {string} value */
function quote(value) {
  return `"${value.replace(/[\\"]/g, '\\$&')}"`;
}

/** @param {Header} header */
function addHeader([name, value]) {
  return `add_header ${name} ${quote(value)} always;`;
}

/** @param {string} path */
function prefix(path) {
  return path.endsWith(ROOT_PATH) ? path.slice(0, -1) : path;
}

/**
 * @param {string} head
 * @param {string[]} lines
 * @returns {string}
 */
function location(head, lines) {
  const body = lines.map((line) => `${INDENT}${INDENT}${line}`);
  return [`${INDENT}location ${head} {`, ...body, `${INDENT}}`].join('\n');
}

/**
 * Fragment `server { … }`. nginx n'hérite des `add_header` que si le niveau courant n'en déclare
 * aucun : les en-têtes de `/*` sont donc répétés dans chaque `location` plus spécifique.
 * @param {HeaderRule[]} rules
 * @param {Redirect[]} redirects
 * @returns {string}
 */
export function render(rules, redirects) {
  const shared = rules.find((rule) => rule.path === ROOT_PATH)?.headers ?? [];
  const locations = rules.map(({ path, headers }) => {
    const own = path === ROOT_PATH ? [] : headers;
    return location(prefix(path), [...shared, ...own].map(addHeader));
  });
  const moves = redirects.map(({ from, to, status }) =>
    location(`= ${from}`, [...shared.map(addHeader), `return ${status} ${to};`]),
  );
  return ['server {', ...locations, ...moves, '}'].join('\n').concat('\n');
}
