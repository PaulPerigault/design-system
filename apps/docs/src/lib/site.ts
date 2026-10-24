/** Constantes du site : même origine que `site` dans astro.config.mjs. */

export const SITE_URL = 'https://design.paulperigault.dev';
export const SITE_NAME = 'Design system @paulperigault';
export const SITE_LANG = 'fr';
export const SITE_LOCALE = 'fr_FR';
export const TITLE_SUFFIX = 'Design system · Paul Perigault';

export const AUTHOR = {
  name: 'Paul Périgault',
  url: 'https://paulperigault.fr',
  github: 'https://github.com/PaulPerigault',
  jobTitle: 'DevOps / DevSecOps',
} as const;

/** Identifiants JSON-LD stables : le portfolio et ce site désignent le même Person. */
export const PERSON_ID = `${AUTHOR.url}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const REPOSITORY_URL = 'https://github.com/PaulPerigault/design-system';
export const LICENSE_URL = 'https://opensource.org/licenses/MIT';

export const OG_IMAGE = { width: 1200, height: 630 } as const;
