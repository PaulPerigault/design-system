/** Liens croisés avec le portfolio : contrôles purs, réseau et variable d'environnement injectés. */
import { AUTHOR, PERSON_ID, SITE_URL } from './site.ts';

type Node = Record<string, unknown>;

/** Valeur de `PORTFOLIO_LINK_CHECK` qui active la vérification réciproque. */
export const ACTIVE_VALUE = '1';

/** `present` : lien trouvé ; `absent` : page lue sans lien ; `unreachable` : réseau ou statut HTTP. */
export type ReciprocalState = 'present' | 'absent' | 'unreachable';

export interface FetchedPage {
  ok: boolean;
  text(): Promise<string>;
}
export type FetchLike = (url: string) => Promise<FetchedPage>;

const COMMENT = /<!--[\s\S]*?-->/g;
const ANCHOR_HREF = /<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
/** Base fictive : un lien relatif ne peut jamais désigner le site design. */
const OPAQUE_BASE = 'https://portfolio.invalid/';

function hostOf(href: string): string | null {
  try {
    const url = new URL(href.trim(), OPAQUE_BASE);
    return url.protocol === 'https:' ? url.host : null;
  } catch {
    return null;
  }
}

/** La vérification réciproque n'est active que si l'appelant a lu `PORTFOLIO_LINK_CHECK=1`. */
export const crossLinksActive = (flag: string | undefined): boolean => flag === ACTIVE_VALUE;

/** Le HTML du portfolio contient-il un lien `<a href>` vers l'origine de `siteUrl` ? */
export function reciprocalLinkState(html: string, siteUrl: string): 'present' | 'absent' {
  const target = hostOf(siteUrl);
  const hrefs = [...html.replace(COMMENT, '').matchAll(ANCHOR_HREF)].map(
    (match) => match[1] ?? match[2] ?? match[3] ?? '',
  );
  return target !== null && hrefs.some((href) => hostOf(href) === target) ? 'present' : 'absent';
}

/** Lit la page du portfolio avec le `fetch` reçu ; toute erreur donne `unreachable`. */
export async function checkReciprocal(
  fetchPage: FetchLike,
  portfolioUrl: string = AUTHOR.url,
  siteUrl: string = SITE_URL,
): Promise<ReciprocalState> {
  try {
    const response = await fetchPage(portfolioUrl);
    if (!response.ok) return 'unreachable';
    return reciprocalLinkState(await response.text(), siteUrl);
  } catch {
    return 'unreachable';
  }
}

/** Nœuds JSON-LD d'un `@type` donné, à tous les niveaux (graphe ou imbriqués). */
export function findNodes(data: unknown, type: string): Node[] {
  if (Array.isArray(data)) return data.flatMap((item) => findNodes(item, type));
  if (data === null || typeof data !== 'object') return [];
  const node = data as Node;
  const own = node['@type'] === type ? [node] : [];
  return [...own, ...Object.values(node).flatMap((value) => findNodes(value, type))];
}

const idOf = (value: unknown): unknown =>
  value !== null && typeof value === 'object' ? (value as Node)['@id'] : undefined;

/** Écarts d'un nœud `Person` avec ce que le portfolio publie. Liste vide : conforme. */
export function personProblems(node: Node): string[] {
  const sameAs = Array.isArray(node.sameAs) ? node.sameAs : [];
  const missing = [AUTHOR.url, AUTHOR.github].filter((url) => !sameAs.includes(url));
  return [
    ...(node['@id'] === PERSON_ID ? [] : [`@id ≠ ${PERSON_ID}`]),
    ...(node.url === AUTHOR.url ? [] : [`url ≠ ${AUTHOR.url}`]),
    ...missing.map((url) => `sameAs sans ${url}`),
  ];
}

/** Écarts d'un nœud `WebSite` : adresse du site design et renvoi vers le Person. */
export function websiteProblems(node: Node): string[] {
  return [
    ...(node.url === `${SITE_URL}/` ? [] : [`url ≠ ${SITE_URL}/`]),
    ...(idOf(node.author) === PERSON_ID ? [] : [`author sans @id ${PERSON_ID}`]),
  ];
}
