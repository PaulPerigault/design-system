# Configuration GitHub

État au 2026-10-28 (étapes F2a-1 et F2a-2). Source : `docs/process/proposal-foundations.md`, décision D-031.

## État

| Élément         | État                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Labels          | 28, versionnés dans `.github/labels.json`, synchronisés par script                                                              |
| Project         | n° 13 « design system », public (dépôt public), lié au dépôt                                                                    |
| Champs          | `Lot`, `Priorite`, `Taille`, `Paquet` créés ; options de `Status` : manuel                                                      |
| Milestones      | décrits, à créer par Paul (`docs/manual-steps.md` §7.2)                                                                         |
| Vues, workflows | manuels (`docs/manual-steps.md` §7.3 et §7.4)                                                                                   |
| Ruleset, `main` | `develop` renommée en `main` ; ruleset (`.github/rulesets/main.json`) et options : à poser par Paul (`docs/manual-steps.md` §8) |

## Relancer la synchronisation des labels

```shell
node tools/github/sync-labels.mjs           # dry-run : + crée, ~ met à jour, - supprime
node tools/github/sync-labels.mjs --apply   # applique
```

Le fichier `.github/labels.json` fait foi : un label absent du fichier est supprimé. Noms en ASCII
minuscule (`[a-z0-9:-]`), couleur hexadécimale à 6 chiffres, description de 100 caractères au plus.
Pour ajouter ou changer un label : modifier le fichier dans une PR, puis lancer `--apply`.

## Branches

`<type>/<issue>-<slug>`, en minuscules : `fonction/142-cluster-gap`, `tache/155-hook-pre-push`.
Types : `fonction`, `bogue`, `tache`, `doc`, `chantier` ; les étapes de processus utilisent aussi
`processus/<étape>-<slug>`. Une branche = une issue = une PR.

## Chaîne obligatoire

1. **Issue** : assignee, labels (`type:`, `pkg:`, `prio:`, `taille:`), milestone, description complète.
2. **Branche** nommée d'après l'issue.
3. **Commits** en Conventional Commits, sujet en minuscules, `Refs #n` dans le corps.
4. **PR** vers `main` : `Closes #n` dans la description, ajoutée au Project
   (`gh project item-add 13 --owner PaulPerigault --url <PR>`).
5. **Fusion** squash (`gh pr merge <n> --squash --delete-branch --subject … --body-file …`) : l'issue se
   ferme, la carte passe à `Fait`.

Avant F2b, aucune issue n'existe : la PR cite l'étape (`F2a-1`) dans sa description. Aucun commentaire
n'est posté dans les issues ni les PR : les informations vont dans la description ou le journal
(`docs/journal/`).

## Suite

F2a-3 : previews Cloudflare (`tofu apply` par Paul), puis F2b (modèles, contrôle « PR liée à une issue », issues de rattrapage).
