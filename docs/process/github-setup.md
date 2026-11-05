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

## Dates et vue Roadmap

Les dates du Project 13 viennent de `.github/roadmap-dates.json` : début et échéance de chaque issue, avec une nature `fact` (création et fermeture lues avec `gh`) ou `estimate` (note obligatoire : rythme observé de 10 à 15 PR par jour de travail, publication npm 0.x environ une semaine après les actions de Paul, version 1.0 dans deux à trois semaines). Les estimations se réécrivent à la main dans le fichier ; une issue fermée prend ses dates factuelles.

```shell
node tools/github/sync-project-dates.mjs            # dry-run : plan seulement
node tools/github/sync-project-dates.mjs --apply    # crée les champs « Début » et « Échéance », écrit les dates
```

Le script est idempotent (une valeur déjà posée n'est pas réécrite) et exige le scope `project` de `gh` (`gh auth refresh -s project`). `gh project item-list` abîme l'initiale de la clé « Échéance » (`��chéance`) : le champ se lit par nom normalisé (`field`, `tools/github/traceability/issue-rules.mjs`).

Deux scripts complètent les dates, sur le même modèle (dry-run par défaut, `--apply`, idempotents) :

```shell
node tools/github/sync-catch-up-dates.mjs   # #42 à #66 : dates des PR de catch-up.md (Q23), réécrit le fichier
node tools/github/sync-project-pulls.mjs    # PR fusionnées depuis #38 : ajout au Project, Début = création, Échéance = fusion (Q30)
```

Les dates sont des jours civils à l'heure de Paris. `sync-catch-up-dates.mjs --apply` ne touche que `.github/roadmap-dates.json` ; `sync-project-dates.mjs --apply` pose ensuite les dates dans le Project.

Étapes manuelles de la vue Roadmap, dans l'interface (l'API ne crée pas de vue) :

1. Project 13, `+ New view`, type **Roadmap**, nom « Roadmap ».
2. Réglages de la vue, `Date fields` : début = **Début**, fin = **Échéance**.
3. Regrouper par **Milestone** (`Group by`), niveau de zoom « Month ».
4. Marqueurs : ajouter `Milestone` et `Status` dans `Fields` de la vue ; masquer les cartes de pull request (filtre `-is:pr`).
5. Enregistrer la vue (`Save changes`).

Les deux réglages manuels qui décident de ce que la vue montre :

- **Champs de date** : dans `Date fields`, début = « Début » et fin = « Échéance ». Ces deux champs sont de type date (vérifié par GraphQL), donc le script les remplit correctement ; sans ce réglage, la vue n'affiche aucune barre.
- **Échelle** : `Month` ou `Quarter`. `Month` montre le détail des jalons récents, `Quarter` le plan jusqu'à la version 1.0.

Beaucoup d'issues fermées tiennent sur un seul jour (début et échéance identiques) : elles apparaissent comme de très courts repères, pas comme des barres. C'est attendu, pas une erreur du script.

## Suite

F2a-3 : previews Cloudflare (`tofu apply` par Paul), puis F2b (modèles, contrôle « PR liée à une issue », issues de rattrapage).
