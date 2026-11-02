// Mesure des liens externes : un essai HEAD par URL distincte, délai entre les requêtes, jamais
// bloquant. Un site qui refuse (403, 429) ou ne répond pas est consigné, pas un échec.
export const DELAY_MS = 700;
export const TIMEOUT_MS = 10_000;
const OK = (status) => status >= 200 && status < 400;

/** @returns {string[]} URL externes distinctes, hors domaines ignorés, dans l'ordre d'apparition */
export function distinctExternal(urls, ignoredHosts = []) {
  const seen = new Set();
  for (const url of urls) {
    const bare = url.split('#')[0];
    if (!/^https?:\/\//i.test(bare)) continue;
    if (ignoredHosts.includes(new URL(bare).hostname)) continue;
    seen.add(bare);
  }
  return [...seen];
}

/** @returns {Promise<{ url: string, status: number | null, note: string }[]>} */
export async function measureExternal(urls, { fetchStatus, sleep, delayMs = DELAY_MS }) {
  const results = [];
  for (const [index, url] of urls.entries()) {
    if (index > 0) await sleep(delayMs);
    try {
      const status = await fetchStatus(url);
      results.push({ url, status, note: OK(status) ? 'ok' : 'à vérifier' });
    } catch (error) {
      results.push({ url, status: null, note: `sans réponse (${error.message})` });
    }
  }
  return results;
}

/** Réponse HTTP réelle : HEAD, redirections suivies, délai borné. */
export const fetchHead = async (url) =>
  (
    await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  ).status;
