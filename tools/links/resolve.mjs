// Classement et résolution d'un lien d'une page de `dist` : interne (fichier et ancre), externe ou
// ignoré. Pur : l'existence des fichiers est fournie par l'appelant (système de fichiers injecté).
const IGNORED_SCHEMES = /^(mailto|tel|data|javascript|blob|sms):/i;

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Retire l'origine propre du site ; `undefined` si le lien est externe. */
function localTarget(url, origins) {
  const origin = origins.find((prefix) => url.startsWith(prefix));
  if (origin !== undefined) return url.slice(origin.length) || '/';
  return SCHEME.test(url) || url.startsWith('//') ? undefined : url;
}

/** @returns {{ kind: 'skip' } | { kind: 'external', url: string } | { kind: 'internal', path: string, hash: string }} */
export function classify(url, page, origins = []) {
  if (IGNORED_SCHEMES.test(url)) return { kind: 'skip' };
  const target = localTarget(url, origins);
  if (target === undefined) return { kind: 'external', url };
  const hashAt = target.indexOf('#');
  const hash = hashAt === -1 ? '' : decodeURIComponent(target.slice(hashAt + 1));
  const rest = (hashAt === -1 ? target : target.slice(0, hashAt)).split('?')[0];
  if (rest === '') return { kind: 'internal', path: page, hash };
  const base = rest.startsWith('/') ? '/' : `/${page.replace(/[^/]*$/, '')}`;
  return { kind: 'internal', path: normalize(base + rest), hash };
}

/** Chemin absolu normalisé (`.` et `..` résolus), sans le `/` de tête. */
export function normalize(path) {
  const out = [];
  for (const part of path.split('/')) {
    if (part === '..') out.pop();
    else if (part !== '.' && part !== '') out.push(part);
  }
  return out.join('/') + (path.endsWith('/') && out.length > 0 ? '/' : '');
}

/** @returns {string | undefined} fichier de `dist` servi pour ce chemin, selon les règles d'un hébergeur statique */
export function servedFile(path, exists) {
  const candidates =
    path === '' || path.endsWith('/')
      ? [`${path}index.html`]
      : [path, `${path}.html`, `${path}/index.html`];
  return candidates.find((file) => exists(file));
}
