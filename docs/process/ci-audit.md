# Audit de la CI (1bis-a, 2026-10-27)

Source : `gh run view` sur les runs de `develop` (#31, #32) et de la PR `docs/process-decisions`.

## Durées par job (runner Linux)

| Job (workflow CI)     | Durée       | Dont `npm ci` | Remarque                                                                     |
| --------------------- | ----------- | ------------- | ---------------------------------------------------------------------------- |
| commitlint (PR)       | 3 à 22 s    | 12 à 20 s     | exclusif avec `squash-message`                                               |
| squash-message (push) | 32 s        | 21 s          | exclusif avec `commitlint`                                                   |
| verify                | 1 min 59    | 21 s          | `npm run verify` : 1 min 30                                                  |
| site                  | 40 à 55 s   | 11 s          | pack des paquets puis `verify` du site généré                                |
| zizmor                | 18 s        | aucun         |                                                                              |
| e2e                   | 24 à 27 min | 12 s          | `playwright install --with-deps` : 10 min 30 ; build : 16 s ; tests : 16 min |
| ci (agrégat)          | 3 s         | aucun         |                                                                              |

| Autre workflow | Durée           | Remarque                                               |
| -------------- | --------------- | ------------------------------------------------------ |
| Visuel         | 12 à 16 min     | matrice de 13 jobs, chacun `npm ci` + Chromium + build |
| Supply chain   | 42 s à 1 min 16 | `audit` et `sbom` : un `npm ci` chacun                 |
| CodeQL         | 1 min 43        |                                                        |

## Constats

- Chemin critique d'un run : e2e (27 min) ; tout le reste finit en moins de 2 min.
- `npm ci` : 5 exécutions par run CI, 15 avec Visuel (13 jobs), 2 avec Supply chain, soit 22 par push.
  Chacune coûte 11 à 21 s malgré le cache ; le cache npm n'était déclaré que par copie du bloc
  `setup-node` (six copies identiques).
- Contrôles en double : `check:install-scripts` (dans `verify` et dans Supply chain) ; `check:size`
  (dans `verify` et dans le hook pre-commit) ; `npm run verify` (CI et hook pre-push).
- Le pre-push échouait sous Windows (17 tests déjà rouges) : quatre exceptions `HUSKY=0` en une journée.
- Les PR de documentation lançaient e2e (27 min) et Visuel (16 min) sans qu'aucun code ne change.

## Changements (PR 1bis-a)

- Action composite `.github/actions/setup` (setup-node, cache npm, `npm ci --ignore-scripts`) utilisée
  par CI, Visuel et Supply chain. `release.yml` garde son bloc : pas de cache dans un workflow qui publie.
- Job `changes` : e2e sauté si la PR ne touche que `docs/**`, `*.md`, modèles d'issue et de PR.
  `ci` reste exécuté et vert quand e2e est sauté (résultat `skipped`) : un ruleset n'exigera que `ci`.
- Visuel : `paths-ignore` identique (pas un check requis, donc sans risque de blocage).
- Hooks : `commit-msg` (commitlint) et `pre-commit` (lint-staged : eslint et prettier sur les fichiers
  indexés) ; `pre-push` supprimé, `check:size` et `secretlint` retirés du pre-commit (CI : `guard`).
- `check:install-scripts` retiré de Supply chain (reste dans `verify`).

## Gain attendu

| Cas                 | Avant                      | Après                                        |
| ------------------- | -------------------------- | -------------------------------------------- |
| PR de documentation | 27 min + 16 min            | environ 2 min (verify), e2e et Visuel sautés |
| PR de code          | 27 min                     | inchangé (1bis-b : e2e, Visuel)              |
| `git push` local    | `verify` (Windows : échec) | aucun hook                                   |
