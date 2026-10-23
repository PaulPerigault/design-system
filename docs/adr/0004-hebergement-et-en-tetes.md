# ADR-0004 — En-têtes de sécurité indépendants de l'hébergeur, hébergement à choisir

- Statut : proposé (2026-10-23) ; **le choix de l'hébergeur revient au propriétaire**. Aucun code
  d'infrastructure d'hébergement n'est écrit tant qu'il n'a pas choisi.
- Lié : D-024 (CSS en fichiers), D-025, `docs/manual-steps.md`.

## Contexte

Le site de documentation est 100 % statique (Astro, `output: 'static'`). La sécurité du navigateur
repose sur des en-têtes HTTP (CSP, HSTS, `X-Content-Type-Options`, politique de permissions,
isolation cross-origin). L'hébergeur n'est pas décidé ; le kickoff initial prévoyait Cloudflare
Pages, que le brief de reprise ne confirme pas.

## Décision : un modèle commun, quatre adaptateurs testés

`apps/docs/scripts/headers/` calcule une seule politique (`policy.mjs`) et la rend pour chaque
hébergeur : `_headers` et `_redirects` (Cloudflare Pages, lus aussi par Netlify), `netlify.toml`,
`vercel.json`, fragment `nginx.conf`. Un test vérifie que chaque adaptateur porte chaque en-tête
requis ; `csp.spec.ts` charge toutes les pages sous la politique réelle et refuse toute violation.

Points de conception :

- **Pas de `unsafe-inline`.** Le CSS est servi en fichiers (D-024) : `style-src 'self'` sans
  hachage. Un contenu en ligne futur serait couvert par `hashes.mjs` (SHA-256).
- **`'wasm-unsafe-eval'`** dans `script-src` : la recherche Pagefind charge du WebAssembly. C'est la
  seule exception ; `unsafe-eval` reste interdit.
- **Pas de `Cache-Control` sur `/*`** : Cloudflare et Netlify cumulent les valeurs de plusieurs
  règles, ce qui contredirait `immutable` sur `/_astro/*`.
- **HSTS sans `preload`** : l'inscription à la liste de préchargement concerne le domaine apex et
  se retire difficilement ; décision du propriétaire.
- Limite documentée par Cloudflare : un en-tête de `_headers` ne dépasse pas 2 000 caractères.

## Comparaison des hébergeurs (à compléter par le propriétaire)

| Critère                | Cloudflare Pages                                                           | Netlify                          | Vercel (Hobby)                                                                     | GitHub Pages                                                         | VPS Nginx (UE)                                |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| En-têtes personnalisés | oui (`_headers`)                                                           | oui (`_headers`, `netlify.toml`) | oui (`vercel.json`)                                                                | **non** (CSP possible seulement en `<meta>`, sans `frame-ancestors`) | oui (`add_header`)                            |
| Coût du statique       | gratuit, requêtes et bande passante annoncées illimitées                   | à vérifier                       | gratuit pour un usage **personnel non commercial** seulement ; Pro 20 USD par mois | gratuit                                                              | prix du serveur et de son entretien           |
| Localisation et RGPD   | société américaine, localisation des données à vérifier (options payantes) | société américaine, à vérifier   | société américaine, à vérifier                                                     | société américaine                                                   | choix de la région, aucun sous-traitant tiers |
| Sécurité (surface)     | service géré, jetons à restreindre (voir kickoff)                          | service géré                     | service géré                                                                       | service géré, peu de réglages                                        | tout à maintenir : correctifs, TLS, journaux  |
| Souveraineté           | faible                                                                     | faible                           | faible                                                                             | faible                                                               | forte                                         |

Sources : documentation Cloudflare Pages (en-têtes et limites), fiche du plan Hobby de Vercel
(usage personnel non commercial), discussions GitHub sur l'absence d'en-têtes personnalisés sur
Pages. Les cases « à vérifier » ne sont pas établies ici : « prouvé » seulement avec une source.

## Conséquences

- Le choix se fait sans refonte : copier `_headers` et `_redirects` (ou le fichier de l'hébergeur
  retenu, dans `apps/docs/deploy/`) et configurer le domaine.
- GitHub Pages seul ne satisfait pas la politique (pas d'en-têtes) : exclu, sauf devant un
  service qui ajoute les en-têtes.
- Avant la mise en production : renseigner l'hébergeur dans les mentions légales (le build de
  production échoue si le champ est vide).
