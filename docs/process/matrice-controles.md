# Matrice « qui vérifie quoi » (1bis-d, #80)

Établie le 2026-11-01 par lecture de `package.json`, `.husky/`, `.github/workflows/` et
`.github/rulesets/main.json`. Elle décrit l'état du dépôt ; en cas d'écart, les fichiers gagnent.
Décisions liées : D-028, D-029 (déclencheurs), D-048 (job `docs`), D-094 (job `wasm`).

Le seul contrôle requis par le ruleset `main` est `ci` (agrégat) : un job de la CI bloque la
fusion par lui. Les autres workflows ne sont pas requis.

## Hooks locaux (`.husky/`)

| Hook         | Contrôle                                                                    | Bloque                    |
| ------------ | --------------------------------------------------------------------------- | ------------------------- |
| `commit-msg` | commitlint (Conventional Commits, aucune signature d'outil)                 | le commit                 |
| `pre-commit` | lint-staged : `eslint --fix` et `prettier --write` sur les fichiers indexés | le commit (erreur ESLint) |

Il n'y a plus de `pre-push` (audit 1bis-a) : `npm run verify` se lance à la main avant l'envoi.

## Étapes de `npm run verify`

Exécuté par le job `verify` sur PR, sur `main` et au cron. `guard` regroupe les contrôles de dépôt.

| Étape    | Commande                                    | Ce qu'elle vérifie                                          |
| -------- | ------------------------------------------- | ----------------------------------------------------------- |
| guard    | `check:secrets`                             | aucun secret (secretlint)                                   |
| guard    | `check:size`                                | fichier ≤ 120 lignes                                        |
| guard    | `check:lockfile`                            | npmjs uniquement, aucune dépendance `file:` ou `link:`      |
| guard    | `check:guards`                              | couleurs, couches, tokens, images (`pp-guards.config.json`) |
| guard    | `check:tokens`                              | tokens à jour, aucune valeur brute                          |
| guard    | `check:registry`                            | `registry.json` et fragments à jour                         |
| guard    | `check:install-scripts`                     | scripts d'installation en liste blanche                     |
| guard    | `check:security-txt`                        | `security.txt` valide                                       |
| guard    | `check:issue-templates`                     | modèles d'issue complets                                    |
| guard    | `check:readability`                         | lisibilité des textes (avertit, ne bloque pas)              |
| lint     | `eslint .`                                  | règles de code                                              |
| format   | `prettier --check .`                        | mise en forme                                               |
| tests    | `vitest run`                                | tous les projets                                            |
| build    | `build --workspaces`                        | compilation de chaque paquet                                |
| données  | `check:mcp-data`                            | `docs.json`, `adr.json`, `components.json` à jour           |
| vecteurs | `check:color-vectors`, `check:data-vectors` | vecteurs de parité Rust et TypeScript à jour                |
| mcp      | `check:mcp-self-test`                       | `pp-mcp --self-test`                                        |
| docs     | `check:typography`                          | orthotypographie du texte rendu (mesure, job `docs`)        |
| docs     | `docs run check`                            | `astro check`                                               |
| paquets  | `check:pack`                                | `npm pack --dry-run` de chaque paquet                       |

## Workflows

| Workflow / job                    | Déclencheur                    | Contrôle                                                         | Bloque la fusion      |
| --------------------------------- | ------------------------------ | ---------------------------------------------------------------- | --------------------- |
| CI / `commitlint`                 | PR                             | titre et corps de la PR (futur message de squash)                | oui, via `ci`         |
| CI / `squash-message`             | main                           | message du commit de squash créé par GitHub                      | sans objet (après)    |
| CI / `verify`                     | PR, main, cron                 | `npm run verify` (tableau ci-dessus)                             | oui, via `ci`         |
| CI / `docs`                       | PR, main, cron                 | build de la doc sans `dist/` préalable ; résumé images (D-104)   | oui, via `ci`         |
| CI / `changes`                    | PR, main, cron                 | calcule `render`, `full`, `rust`, `wasm` d'après les chemins     | non (aiguillage)      |
| CI / `e2e`                        | PR de rendu, cron              | Playwright : 3 projets sur PR, matrice complète au cron          | oui, via `ci`         |
| CI / `visuel`                     | PR de rendu                    | appelle `visual.yml` : captures contre références                | oui, via `ci`         |
| CI / `rust`                       | PR (chemins Rust), cron        | `cargo fmt`, `clippy`, `test`, `audit`, `deny`                   | oui, via `ci`         |
| CI / `wasm`                       | PR (chemins wasm), cron        | build `.wasm`, empreinte, parité, poids, SBOM                    | oui, via `ci`         |
| CI / `site`                       | PR, main, cron                 | site généré par `create`, installé sur les tarballs, `verify`    | oui, via `ci`         |
| CI / `zizmor`                     | PR, main, cron                 | audit statique des workflows                                     | oui, via `ci`         |
| Skills amont (`skills-amont.yml`) | mensuel, manuel                | SHA amont des skills tiers (D-116), lecture seule, résumé du job | non (information)     |
| CI / `ci`                         | PR, main, cron                 | agrégat des jobs ; **seul check requis**                         | oui                   |
| CodeQL / `analyze`                | PR, main, cron (lundi)         | analyse statique JavaScript et TypeScript                        | non requis            |
| Supply chain / `audit`            | PR, main, cron (quotidien)     | `npm audit signatures` et `npm audit --audit-level=high`         | non requis            |
| Supply chain / `sbom`             | PR, main, cron                 | SBOM CycloneDX en artefact                                       | non requis            |
| Scorecard / `analysis`            | main, cron (mardi), manuel     | note OpenSSF publiée pour le badge                               | non requis            |
| Visuel                            | manuel, cron (lundi), appel    | captures ; `update` régénère les références                      | via `ci` quand appelé |
| Dependabot auto-merge             | PR de Dependabot               | active la fusion automatique des correctifs et mineures          | sans objet            |
| Release / `release-please`        | main                           | PR de release et tags                                            | sans objet            |
| Release / `publish`               | main, si une release est créée | build, `.wasm`, empreinte, `audit signatures`, SBOM, OIDC        | sans objet            |

## Doublons : justifiés ou supprimés

| Contrôle en double             | Où                                                        | Décision                                                                                                           |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `verify` sur PR et sur `main`  | CI                                                        | gardé : `main` revérifie le résultat du squash, qui diffère de la branche                                          |
| ESLint et Prettier             | hook `pre-commit` et `verify`                             | gardé : le hook ne voit que les fichiers indexés (retour rapide) ; `verify` voit tout le dépôt                     |
| commitlint                     | hook `commit-msg`, job `commitlint`, job `squash-message` | gardé : les commits de branche disparaissent au squash ; le titre et le corps de la PR sont relus avant puis après |
| build des paquets              | `verify`, `e2e`, `wasm`, `release`                        | gardé : chaque job part d'un dépôt propre ; partager un artefact coûterait plus de complexité que de secondes      |
| build de la doc                | job `docs` et `verify`                                    | gardé (D-048) : `verify` compile tout avant la doc et masquerait un `prebuild` manquant                            |
| `npm audit signatures`         | Supply chain et `release`                                 | gardé : le second est la porte juste avant la publication                                                          |
| SBOM                           | Supply chain, `wasm`, `release`                           | gardé : Supply chain contrôle chaque PR ; `wasm` ajoute le `.wasm` et les crates ; `release` publie l'artefact     |
| tests de `color` et `data`     | `verify` (`vitest run`) et `wasm`                         | gardé : `wasm` rejoue avec `PP_DATA_WASM=required` sur le `.wasm` construit ; `verify` ne l'exige pas              |
| Visuel                         | CI (appel) et cron                                        | gardé : le cron attrape la dérive sans PR (Chromium, polices)                                                      |
| `check:install-scripts`        | `verify` seul                                             | doublon avec Supply chain supprimé (audit 1bis-a)                                                                  |
| `check:size`                   | `verify` seul                                             | doublon avec le hook supprimé (audit 1bis-a)                                                                       |
| `npm run verify` au `pre-push` | supprimé                                                  | le hook échouait sous Windows (audit 1bis-a)                                                                       |

## Workflows cités

Présents dans `.github/workflows/` au 2026-11-01 : `ci.yml`, `codeql.yml`,
`dependabot-automerge.yml`, `release.yml`, `scorecard.yml`, `skills-amont.yml`, `supply-chain.yml`, `visual.yml`.
Ruleset : `.github/rulesets/main.json` (PR obligatoire, squash seul, historique linéaire, check `ci`).
