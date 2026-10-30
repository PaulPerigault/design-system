# Historique : actions du propriétaire (2026-10-21) et tableaux de PR

Déplacé tel quel depuis `docs/run-report.md` (D-080).

## Actions du propriétaire

Commandes exactes dans [manual-steps.md](../manual-steps.md). Dans l'ordre :

1. **Étendre les deux jetons GitHub IaC** (`GITHUB_IAC_TOKEN`, `IAC_GITHUB_READONLY_TOKEN`) au
   dépôt `PaulPerigault/design-system` (réglages GitHub, sans API).
2. **`apply` OpenTofu** des trois briques du portfolio (`infra/github`, `infra/identity`,
   `infra/`), chacune après lecture de son plan : crée `main`, les rulesets, l'environnement
   `npm-publish`, le projet Pages et `design.paulperigault.dev`.
3. **Trusted publisher npm** pour les cinq paquets (avec une `0.0.0` d'amorce si la page de
   réglages n'existe pas encore), workflow `release.yml`, environnement `npm-publish`.
4. **Fusions vers `main`** : chaque PR vers `main`, puis la PR de release-please (fusionnée par Paul).
5. Ensuite : L9 (migration du portfolio vers `next`), reprise par l'assistant.

## PR

| Dépôt         | PR                     | État                                                 |
| ------------- | ---------------------- | ---------------------------------------------------- |
| design-system | #1 à #7, #9, #10, #11  | fusionnées dans `develop`                            |
| design-system | #8                     | fermée (remplacée par #9 : sujets de commit refusés) |
| portfolio     | #263, #265, #267, #269 | fusionnées dans `develop`                            |
| portfolio     | #264                   | fermée (sonde temporaire)                            |
| portfolio     | #270                   | fusionnée : empreintes du favicon                    |
| portfolio     | #271                   | `vite` 8.3.5 (avis de sécurité du 2026-10-21)        |
