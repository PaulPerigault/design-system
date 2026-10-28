# Design system @paulperigault

[![CI](https://github.com/PaulPerigault/design-system/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PaulPerigault/design-system/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/PaulPerigault/design-system/badge)](https://scorecard.dev/viewer/?uri=github.com/PaulPerigault/design-system)

Design system de [paulperigault.fr](https://paulperigault.fr) : tokens, CSS, composants Astro accessibles, garde-fous de conception et CLI, publiés sur npmjs sous le scope `@paulperigault`.

| Paquet                   | Rôle                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `@paulperigault/tokens`  | design tokens au format DTCG 2025.10, générés en CSS, JSON et types ; couleur et contraste |
| `@paulperigault/css`     | base, reset, impression, polices et thème Tailwind v4                                      |
| `@paulperigault/dataviz` | contrat de données, formatage fr et palettes accessibles dérivées de l'accent              |
| `@paulperigault/astro`   | composants `.astro` publiés en source                                                      |
| `@paulperigault/guards`  | contrôles de conception et config ESLint                                                   |
| `@paulperigault/create`  | CLI `create`, `add`, `eject`, `diff`                                                       |
| `@paulperigault/mcp`     | serveur MCP (stdio, lecture seule) du design system                                        |

Documentation vivante : `apps/docs` (design.paulperigault.dev).

## Développement

Node 24, npm 11. Installation avec `npm ci`, vérification complète avec `npm run verify`. Règles du dépôt : [AGENTS.md](AGENTS.md). Décisions : [docs/decisions-log.md](docs/decisions-log.md) et `docs/adr/`.

## Statut

En construction : versions `0.x`, rien n'est encore publié. Les publications passent uniquement par le workflow `release` (trusted publishing OIDC, provenance), jamais depuis un poste.

## Sécurité

Signalement et mesures en place : [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE).
