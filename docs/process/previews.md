# Previews Cloudflare Pages par PR

Décision D-036. Intégration Git native de Cloudflare Pages : aucun workflow GitHub, aucun jeton
Cloudflare dans le dépôt. La branche de production est `main` ; toute autre branche est une preview.

## Comment une PR obtient son URL

1. Une PR est ouverte depuis une branche du dépôt : Cloudflare lance un build de la branche.
2. L'application GitHub de Cloudflare ajoute à la PR un statut « Cloudflare Pages » et, une fois le
   build fini, l'URL du déploiement (`https://<hash>.<projet>.pages.dev`). L'alias de branche
   (`https://<branche>.<projet>.pages.dev`, `/` et `_` devenant `-`) suit le dernier commit.
3. Chaque nouveau commit relance un build et un nouveau déploiement.

Retrouver l'URL : section « Checks » de la PR, ligne « Cloudflare Pages », lien « Details » ; ou
tableau de bord, Workers & Pages, projet des docs, onglet Deployments.

## Réglages du projet

| Réglage               | Valeur                                              |
| --------------------- | --------------------------------------------------- |
| Source                | GitHub, `PaulPerigault/design-system`               |
| Branche de production | `main`                                              |
| Previews              | toutes les branches non production (PR comprises)   |
| Commande de build     | `npm ci && npm -w @paulperigault/docs run build`    |
| Dossier de sortie     | `apps/docs/dist`                                    |
| Dossier racine        | `/` (monorepo : l'installation se fait à la racine) |
| Variables             | `NODE_VERSION=24` (identique à `.nvmrc`)            |

Le projet est déclaré en OpenTofu (brique `infra/` du dépôt portfolio, voir `docs/manual-steps.md`
§11). L'autorisation de l'application GitHub de Cloudflare sur le dépôt est manuelle : aucune API
ne l'accorde.

## En-têtes de sécurité et `_headers`

`npm -w @paulperigault/docs run build` finit par `scripts/headers.mjs`, qui écrit `dist/_headers` et
`dist/_redirects` (CSP stricte sans hachage de style, HSTS, COOP/CORP/COEP, `X-Frame-Options`, cache
immuable de `/_astro/*`). Cloudflare Pages les applique aux previews comme à la production : une
preview montre donc la politique réelle. Le build échoue si un en-tête requis manque ou si un
attribut `style=""` apparaît.

Cloudflare ajoute `X-Robots-Tag: noindex` à toutes les previews (documentation Cloudflare Pages,
« Preview deployments ») : aucune règle à écrire. Vérification :

```powershell
curl.exe -sI https://<url de la preview> | Select-String 'x-robots-tag|content-security-policy'
```

La production (`design.paulperigault.dev`) ne reçoit pas ce `noindex`.

## Limites de l'offre gratuite

Source : documentation Cloudflare Pages, « Limits » (consultée le 2026-10-28).

- 500 builds par mois, 1 build à la fois, 20 minutes de build au plus : une PR qui pousse dix
  commits consomme dix builds. Grouper les commits avant de pousser.
- 20 000 fichiers par déploiement, 25 MiB par fichier, 100 règles dans `_headers`.
- Previews actives : nombre illimité.
