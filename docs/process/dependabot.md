# Dépendances : Dependabot et règles de fusion (#131)

Sources : `.github/dependabot.yml`, `.github/workflows/dependabot-automerge.yml`,
`.github/rulesets/main.json`, `SECURITY.md`. État relevé le 2026-10-30.

## Règle

- Correctifs et versions mineures : fusion automatique en squash, quand le contrôle `ci` du
  ruleset de `main` est vert. Aucun changement de comportement n'est attendu d'une telle mise à jour.
- Versions majeures : jamais fusionnées par le workflow. Relecture humaine du journal des
  changements, puis fusion à la main, une à la fois.
- Une mise à jour de sécurité passe avant le reste : elle se traite le jour même, majeure ou non.

## Qui fait quoi

| Acteur                        | Rôle                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Dependabot                    | ouvre les PR chaque semaine ; versions publiées depuis moins de 3 jours ignorées       |
| `dependabot-automerge.yml`    | pour un correctif ou une mineure : `gh pr merge --auto --squash`                       |
| ruleset de `main`             | n'autorise que le squash et exige `ci` ; GitHub fusionne seulement quand `ci` est vert |
| propriétaire ou orchestrateur | relit chaque majeure, fusionne avec `--subject` et `--body-file`, jamais `--auto`      |

## Configuration (`dependabot.yml`)

- Écosystèmes : `npm` (racine, qui couvre les workspaces) et `github-actions`. Cargo s'ajoutera
  avec le premier crate Rust, pas avant.
- Cadence : hebdomadaire. Délai de réaction : 3 jours (7 pour une majeure), pour laisser le temps
  de retirer un paquet compromis. C'est une convention, pas une garantie.
- Groupes npm (mineures et correctifs seulement) : `astro`, `tailwind`, `mcp`, `tests`, `tooling`.
  Groupe `actions` pour GitHub Actions. Une majeure n'entre dans aucun groupe : une PR par paquet.
- `open-pull-requests-limit: 8` pour npm. Aucun `ignore` : toute majeure est proposée.
- Les groupes séparent les dépendances de rendu (Astro, Tailwind) des outils : une PR de rendu
  lance e2e et Visuel, les autres non. Une seule PR par semaine n'est donc pas visée (écart
  assumé avec l'intitulé de #131).

## Vérification du workflow d'auto-fusion

- Il se déclenche sur `pull_request` vers `main`, seulement pour `dependabot[bot]`, avec les
  permissions `contents` et `pull-requests` en écriture, et rien d'autre.
- `--auto` ne contourne pas le ruleset : la fusion attend `ci`, sans contournement
  (`bypass_actors` vide). Le dépôt autorise la fusion automatique (`allow_auto_merge`).
- Contrôle réel : les PR #27 (zod 4.6.6 vers 4.6.7) et #28 (zizmor-action 0.6.4 vers 0.7.1)
  ont été fusionnées par `github-actions`.

## Lire une alerte

1. Onglet Security, Dependabot : paquet, plage touchée, version corrigée, gravité (CVSS).
2. Le paquet est-il de production ou de développement ? Dans `package-lock.json`, `"dev": true`
   le dit. Une alerte de développement n'atteint pas les paquets publiés.
3. Le chemin vulnérable est-il appelé ? `npm ls <paquet>` donne qui l'amène.
4. Corriger : mettre à jour vers la version corrigée ; sinon `overrides` justifié par une D-xxx.
5. `npm audit` et `npm audit signatures` (job `supply-chain`) recoupent, sans remplacer l'alerte.

Une faille du dépôt lui-même ne se signale pas dans une issue (`SECURITY.md`).

## Procédure pour une majeure (5 lignes)

1. Lire le journal des changements entre les deux versions, noter les ruptures annoncées.
2. `npm ci`, puis `npm run verify` sur la branche de la PR.
3. Dépendance de rendu : attendre e2e et Visuel verts, relire les images régénérées.
4. Fusion : `gh pr merge <n> --squash --delete-branch --subject "<titre>" --body-file <fichier>`.
5. Journal du jour ; D-xxx si la mise à jour change une règle ou un usage.

## Écart constaté le 2026-10-30

Les alertes Dependabot et les mises à jour de sécurité sont désactivées sur le dépôt (API :
« Dependabot alerts are disabled »). Seul `npm audit` voit les failles connues. Les activer est un
réglage du dépôt, à faire par le propriétaire ; commandes dans `tmp/questions-paul.md`.
