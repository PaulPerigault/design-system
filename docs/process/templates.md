# Modèles d'issue et de PR

État au 2026-10-28 (étape F2b-1). Décision : D-033. Source : `docs/process/proposal-foundations.md` §3.

Les modèles sont écrits pour ce projet. Aucune issue vierge : `config.yml` les refuse et renvoie
vers la politique de sécurité (signalement privé) et la documentation.

## Les six modèles

| Fichier                    | Label             | Quand l'utiliser                                         |
| -------------------------- | ----------------- | -------------------------------------------------------- |
| `fonctionnalite.yml`       | `type:fonction`   | Une nouvelle capacité d'un paquet ou de la documentation |
| `bogue.yml`                | `type:bogue`      | Un comportement observé diffère du comportement attendu  |
| `tache.yml`                | `type:tache`      | Un travail délimité : fichiers autorisés, acceptation    |
| `rattrapage.yml`           | `type:rattrapage` | Un lot livré avant le processus (L0 à L20), créé fermé   |
| `epique.yml`               | `type:chantier`   | Issue parente : liste ses sous-issues en cases           |
| `PULL_REQUEST_TEMPLATE.md` | aucun             | Toute PR vers `main`                                     |

Tous les formulaires fixent `assignees: [PaulPerigault]` et `projects: ['PaulPerigault/13']`. Le
label `type:` vient du modèle. Les champs obligatoires garantissent une issue complète : contexte,
objectif, critères d'acceptation en cases, paquet, taille, jalon, définition de fini.

## Ce que le formulaire ne règle pas

- **Milestone** : un formulaire ne peut pas le poser. Le champ obligatoire « Jalon à rattacher »
  indique lequel mettre ; Paul ou Claude Code le renseigne à la création.
- **Labels `pkg:`, `taille:`, `prio:`** : reportés depuis les listes « Paquet concerné » et « Taille »
  (même noms que `.github/labels.json`). Jamais de label créé à la main.
- Le jalon `M-analyse` figure dans les listes ; il n'existe pas encore dans
  `docs/manual-steps.md` §7.2 (à créer par Paul avant la première issue qui le cite).

## Relier épique, sous-issues et PR

1. Ouvrir l'épique (`type:chantier`, taille `cahier`, jamais assignée au travail).
2. Ouvrir chaque sous-issue (tâche, fonctionnalité ou bogue) avec le numéro de l'épique dans
   « Issue parente ».
3. Lister les sous-issues dans l'épique en cases `- [ ] #n` : GitHub suit l'avancement.
4. Une branche `<type>/<n>-<slug>` par sous-issue, une PR qui porte `Closes #n`.
5. La fusion ferme la sous-issue ; l'épique se ferme quand toutes ses cases sont cochées.

## Entrée dans le Project

Le formulaire ajoute l'issue au Project n° 13 à la création (`projects:`). Pour une issue créée par
`gh`, ajouter `--project "design system"` ou lancer
`gh project item-add 13 --owner PaulPerigault --url <issue>`. Le workflow « Auto-add to project » du
Project (`docs/manual-steps.md` §7.4) reprend le même rôle pour les issues et PR sans ajout explicite.
Les PR sont ajoutées par `gh project item-add` (chaîne : `docs/process/github-setup.md`).

## Contrôle

`npm run check:issue-templates` (dans `guard`) vérifie : clés requises, labels présents dans
`.github/labels.json`, options de « Paquet » alignées sur les labels `pkg:`, identifiants uniques,
issues vierges désactivées.

## Pull request

Sections courtes : quoi et pourquoi, issue liée (`Closes #n`), type, vérifications, impact visuel
ou accessibilité, notes pour la fusion. Titre en Conventional Commits, minuscules, 72 caractères au
plus avec `(#n)`. Corps à 90 colonnes au plus. Aucune signature d'outil.
