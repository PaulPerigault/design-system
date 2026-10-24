/** Balises SEO et JSON-LD schema.org (logique pure, sans dépendance au rendu). */
import {
  AUTHOR,
  LICENSE_URL,
  PERSON_ID,
  REPOSITORY_URL,
  SITE_LANG,
  SITE_NAME,
  SITE_URL,
  TITLE_SUFFIX,
  WEBSITE_ID,
} from './site.ts';

export type JsonLd = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  /** Chemin (`/components/`) ou URL absolue. */
  path: string;
}

/** Titre d'onglet : `Titre · Design system · Paul Perigault`. */
export const titleOf = (page: string): string => `${page} · ${TITLE_SUFFIX}`;

/** URL canonique absolue : barre finale, sans paramètre ni ancre. */
export function canonicalOf(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '';
  const rooted = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${rooted.endsWith('/') ? rooted : `${rooted}/`}`;
}

/** Nom de l'image Open Graph : dernier segment du chemin, `index` pour l'accueil. */
export function ogSlugOf(pathname: string): string {
  const segments = canonicalOf(pathname).slice(SITE_URL.length).split('/').filter(Boolean);
  return segments.at(-1) ?? 'index';
}

export const ogImageOf = (pathname: string): string => `${SITE_URL}/og/${ogSlugOf(pathname)}.png`;

export const personLd = (): JsonLd => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR.name,
  url: AUTHOR.url,
  sameAs: [AUTHOR.url, AUTHOR.github],
  jobTitle: AUTHOR.jobTitle,
});

export const websiteLd = (): JsonLd => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  inLanguage: SITE_LANG,
  author: personLd(),
});

export const softwareLd = (): JsonLd => ({
  '@type': 'SoftwareSourceCode',
  name: SITE_NAME,
  codeRepository: REPOSITORY_URL,
  license: LICENSE_URL,
  programmingLanguage: 'TypeScript',
  author: personLd(),
});

export interface TechArticleInput {
  title: string;
  description: string;
  url: string;
}

export const techArticleLd = ({ title, description, url }: TechArticleInput): JsonLd => ({
  '@type': 'TechArticle',
  headline: title,
  description,
  url,
  mainEntityOfPage: url,
  inLanguage: SITE_LANG,
  author: personLd(),
});

/** URL absolue ; l'ancre est conservée (`/composants/`) pour distinguer les niveaux du fil. */
const absolute = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const breadcrumbLd = (items: readonly BreadcrumbItem[]): JsonLd => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.name,
    item: absolute(entry.path),
  })),
});

/** Graphe unique : `@context` une seule fois, nœuds sans `@context` propre. */
export const graph = (...nodes: JsonLd[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@graph': nodes,
});

/** Sérialisation sûre dans un `<script>` : `<` devient `\u003c`. */
export const serialize = (data: JsonLd): string => JSON.stringify(data).replace(/</g, '\\u003c');
