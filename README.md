# Design system @paulperigault

Design system de [paulperigault.fr](https://paulperigault.fr) : tokens, CSS, composants Astro accessibles, garde-fous de conception et CLI, publiés sur npmjs sous le scope `@paulperigault`.

| Paquet                  | Rôle                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `@paulperigault/tokens` | design tokens au format DTCG 2025.10, générés en CSS, JSON et types ; couleur et contraste |
| `@paulperigault/css`    | base, reset, impression, polices et thème Tailwind v4                                      |
| `@paulperigault/astro`  | composants `.astro` publiés en source                                                      |
| `@paulperigault/guards` | contrôles de conception et config ESLint                                                   |
| `@paulperigault/create` | CLI `create`, `add`, `eject`, `diff`                                                       |

Documentation vivante : `apps/docs` (ds.paulperigault.dev).

## Développement

Node 24, npm 11. Installation avec `npm ci`, vérification complète avec `npm run verify`. Règles du dépôt : [AGENTS.md](AGENTS.md). Décisions : [docs/decisions-log.md](docs/decisions-log.md) et `docs/adr/`.

## Statut

En construction : versions `0.x`, rien n'est encore publié. Les publications passent uniquement par le workflow `release` (trusted publishing OIDC, provenance), jamais depuis un poste.

## Licence

[MIT](LICENSE).
