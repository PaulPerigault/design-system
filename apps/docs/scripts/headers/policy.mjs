/** @typedef {[name: string, value: string]} Header */
/** @typedef {{ path: string, headers: Header[] }} HeaderRule  path: '/*' ou '/_astro/*' */
/** @typedef {{ from: string, to: string, status: number }} Redirect */

const HSTS_MAX_AGE_SECONDS = 63072000;
const ONE_YEAR_SECONDS = 31536000;

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'autoplay=()',
  'camera=()',
  'display-capture=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(', ');

/**
 * Politique CSP sans `unsafe-inline` ni `unsafe-eval`.
 * `'wasm-unsafe-eval'` : la recherche Pagefind charge du WebAssembly.
 * @param {{ styleHashes: string[], scriptHashes: string[] }} hashes
 * @returns {string}
 */
export function contentSecurityPolicy({ styleHashes, scriptHashes }) {
  return [
    "default-src 'none'",
    ["script-src 'self' 'wasm-unsafe-eval'", ...scriptHashes].join(' '),
    ["style-src 'self'", ...styleHashes].join(' '),
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * En-têtes fixes. Pas de `preload` HSTS : décision d'apex du propriétaire.
 * @returns {Header[]}
 */
export function securityHeaders() {
  return [
    ['Strict-Transport-Security', `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains`],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', PERMISSIONS_POLICY],
    ['Cross-Origin-Opener-Policy', 'same-origin'],
    ['Cross-Origin-Resource-Policy', 'same-origin'],
    ['Cross-Origin-Embedder-Policy', 'require-corp'],
    ['X-Frame-Options', 'DENY'],
    ['X-Permitted-Cross-Domain-Policies', 'none'],
  ];
}

/**
 * Pas de `Cache-Control` sur `/*` : Cloudflare et Netlify cumulent les en-têtes de plusieurs règles
 * (valeurs jointes), ce qui contredirait `immutable` ; HTML = défaut de l'hébergeur (revalidation).
 * @param {{ styleHashes: string[], scriptHashes: string[] }} hashes
 * @returns {HeaderRule[]}
 */
export function buildRules(hashes) {
  return [
    {
      path: '/*',
      headers: [
        ...securityHeaders(),
        ['Content-Security-Policy', contentSecurityPolicy(hashes)],
      ],
    },
    {
      path: '/_astro/*',
      headers: [['Cache-Control', `public, max-age=${ONE_YEAR_SECONDS}, immutable`]],
    },
  ];
}

/** @type {Redirect[]} */
export const REDIRECTS = [{ from: '/index.html', to: '/', status: 301 }];

/** Noms d'en-têtes obligatoires sur `/*` (source unique pour les tests). */
export const REQUIRED_HEADERS = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Cross-Origin-Embedder-Policy',
  'X-Frame-Options',
  'X-Permitted-Cross-Domain-Policies',
  'Cache-Control',
];
