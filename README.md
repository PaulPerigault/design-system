# Design system @paulperigault

[![CI](https://github.com/PaulPerigault/design-system/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PaulPerigault/design-system/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/PaulPerigault/design-system/badge)](https://scorecard.dev/viewer/?uri=github.com/PaulPerigault/design-system)

Je tiens seul le design system de [paulperigault.fr](https://paulperigault.fr). Neuf paquets sont
publiés sur npmjs sous le scope `@paulperigault` depuis la version 0.1.0 (4 novembre 2026), chacun
avec une attestation de provenance. Les règles du dépôt sont écrites une fois dans
[AGENTS.md](AGENTS.md) et vérifiées en CI.

| Paquet                                       | Rôle                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`@paulperigault/tokens`](packages/tokens)   | design tokens au format DTCG 2025.10, générés en CSS, JSON et types ; couleur et contraste |
| [`@paulperigault/css`](packages/css)         | base, reset, impression, polices et thème Tailwind v4                                      |
| [`@paulperigault/dataviz`](packages/dataviz) | contrat de données, formatage fr et palettes accessibles dérivées de l'accent              |
| [`@paulperigault/color`](packages/color)     | couleur OKLCH, contraste WCAG 2 et APCA en WebAssembly (Rust), parité avec `tokens`        |
| [`@paulperigault/data`](packages/data)       | quantiles, agrégation et échantillonnage LTTB en WebAssembly (Rust), parité avec `dataviz` |
| [`@paulperigault/astro`](packages/astro)     | composants `.astro` publiés en source                                                      |
| [`@paulperigault/guards`](packages/guards)   | contrôles de conception et config ESLint                                                   |
| [`@paulperigault/create`](packages/create)   | CLI `create`, `add`, `eject`, `diff`                                                       |
| [`@paulperigault/mcp`](packages/mcp)         | serveur MCP (stdio, lecture seule) du design system                                        |

Documentation vivante : [design.paulperigault.dev](https://design.paulperigault.dev) (source dans
`apps/docs`). Chaque paquet a son README et son `CHANGELOG.md` dans `packages/<nom>/`.

## Installer

Node 24 ou plus récent (champ `engines` des neuf paquets).

```bash
npm create @paulperigault mon-site                    # nouveau site Astro branché sur le système
npm install @paulperigault/css @paulperigault/astro   # projet Astro existant
```

## Statut

Série `0.x`. Selon [SemVer 2.0.0](https://semver.org/lang/fr/) (point 4), l'API publique peut
changer à tout moment tant que la majeure vaut zéro : lire le `CHANGELOG.md` du paquet avant une
mise à jour. Seule la dernière version publiée reçoit des correctifs ([SECURITY.md](SECURITY.md)).

Les publications passent uniquement par le workflow `release` (publication de confiance OIDC,
provenance), jamais depuis un poste. Pour vérifier les signatures et les attestations des paquets
installés dans un projet : `npm audit signatures`. Procédure et contrôles :
[docs/process/publication.md](docs/process/publication.md).

## Développement et contributions

Node 24, npm 11. Installation avec `npm ci`, vérification complète avec `npm run verify`.
Contribuer : [CONTRIBUTING.md](CONTRIBUTING.md) et [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Décisions : [docs/decisions-log.md](docs/decisions-log.md) et [docs/adr/](docs/adr/).

## Sécurité

Signalement et mesures en place : [SECURITY.md](SECURITY.md).

## Licence

Le code des paquets est publié sous licence [MIT](LICENSE). Les textes et l'identité visuelle du
site design.paulperigault.dev sont tous droits réservés
([mentions légales](https://design.paulperigault.dev/mentions-legales/)). Les polices et les outils
tiers gardent leur licence, listée sur la page
[Crédits](https://design.paulperigault.dev/credits/).
