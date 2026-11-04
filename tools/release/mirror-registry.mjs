// Miroir GitHub Packages (#130) : sondes de registre par HTTP, sans passer par la configuration npm.
// `npm view --registry X` est inutilisable ici : setup-node écrit `@paulperigault:registry=` et un
// registre de portée l'emporte sur `--registry`. Toute réponse autre que 200 ou 404 est une erreur.
const NPMJS_URL = 'https://registry.npmjs.org';
const GITHUB_API = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const PAGE = 100;

export class RegistryError extends Error {
  constructor(where, status, detail = '') {
    super(`${where} : réponse inattendue ${status} ${detail}`.trim());
    this.name = 'RegistryError';
    this.where = where;
    this.status = status;
  }
}

const encodeName = (name) => name.replaceAll('/', '%2f');

/** 200 : présent, 404 : absent, tout le reste : RegistryError (jamais « présent » par défaut). */
function verdict(where, response, isPresent) {
  if (response.status === 404) return false;
  if (response.status !== 200) throw new RegistryError(where, response.status);
  return isPresent();
}

/** @returns {(name: string, version: string) => Promise<boolean>} version exacte sur npmjs */
export const npmjsHas = (fetchFn) => async (name, version) => {
  const response = await fetchFn(`${NPMJS_URL}/${encodeName(name)}/${version}`);
  return verdict('npmjs', response, () => true);
};

/** Version exacte dans les versions du paquet, lues par l'API REST (nom sans portée). */
export const githubHas =
  (fetchFn, { owner, token }) =>
  async (name, version) => {
    const base = `${GITHUB_API}/users/${owner}/packages/npm/${encodeURIComponent(name.split('/')[1])}`;
    const headers = { authorization: `Bearer ${token}`, 'x-github-api-version': API_VERSION };
    const response = await fetchFn(`${base}/versions?per_page=${PAGE}`, { headers });
    const where = 'GitHub Packages';
    return verdict(where, response, () =>
      response.json().then((all) => all.some((v) => v.name === version)),
    );
  };

/**
 * Réessaie jusqu'à ce que chaque paquet soit présent ou que `maxMs` soit écoulé.
 * @returns {Promise<{ found: Set<string>, missing: string[] }>} clés `nom@version`
 */
export async function waitFor(specs, has, { maxMs, intervalMs, sleep, now }) {
  const deadline = now() + maxMs;
  const found = new Set();
  for (;;) {
    for (const { name, version } of specs.filter((s) => !found.has(`${s.name}@${s.version}`))) {
      if (await has(name, version)) found.add(`${name}@${version}`);
    }
    const missing = specs.map((s) => `${s.name}@${s.version}`).filter((k) => !found.has(k));
    if (missing.length === 0 || now() + intervalMs >= deadline) return { found, missing };
    await sleep(intervalMs);
  }
}
