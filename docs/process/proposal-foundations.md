# Proposition F1 : fondations du processus

Proposition à valider par Paul (2026-10-27). Rien n'a été créé sur GitHub.

## 1. Inventaire (lecture seule)

- **PR** : 30 ; 25 fusionnées, 5 fermées (#8, #16, #18, #20, #29, remplacées après refus commitlint).
- **Issues** : aucune. **Milestones** : aucun. **Rulesets** : aucun ; `develop` et `main` non protégées.
- **Branches distantes** : 13 (`develop`, dix `lot/*` fusionnées, `feat/ts-strict-guards`, une dependabot).
- **Labels** : 10 par défaut, 3 de dependabot, `accessibility` seul est propre. **Projets** : 9 sur le
  compte, aucun pour ce dépôt. **Modèles** : aucun.
- **Workflows** : `ci` (commitlint, squash-message, verify, site, zizmor), `visual` (échecs connus),
  `codeql`, `supply-chain`, `scorecard`, `dependabot-automerge`, `release` (sur `main`).
- **Hooks** : `commit-msg` (commitlint), `pre-commit` (lint-staged + `check:size`), `pre-push`
  (`npm run verify` : doublon de la CI, rouge sous Windows sur 17 tests déjà en échec).

## 2. Taxonomie

**Identité** : celle d'« Encre » (ADR-0002) : noms courts en minuscules, un préfixe par famille,
description d'une phrase factuelle, nuances d'encre par famille, un seul accent pour `prio:bloquant`.
On supprime les 10 labels par défaut ; on garde `dependencies`.

| Famille   | Labels                                                                                     |
| --------- | ------------------------------------------------------------------------------------------ |
| `type:`   | `fonction`, `bogue`, `tâche`, `rattrapage`, `décision`, `doc`, `accessibilité`, `chantier` |
| `pkg:`    | `tokens`, `css`, `astro`, `guards`, `create`, `mcp`, `docs`, `agents`, `ci`, `processus`   |
| `prio:`   | `bloquant`, `haute`, `normale`, `basse`                                                    |
| `taille:` | `trait` (≤ 30 min), `page` (une session Sonnet), `cahier` (à découper, jamais assignée)    |
| `état:`   | `à-valider` (attend Paul), `bloqué` (cite l'issue bloquante)                               |

**Milestones** : `M-histoire` (L0 à L20, fermé), `M0 fondations`, `M1 TypeScript strict`,
`M2 publication npm 0.x`, `M3 migration du portfolio (L9)`, `M4 Rust pp-color (conditionnel)`, `M5 1.0`.

**Project « design system »** (un seul, tout le projet ; les commits apparaissent par leur PR) :
champs `Status` (`à trier`, `prêt`, `en cours`, `en revue`, `fait`), `Lot` (`L0`…`L20`, `T` pour le
chantier TypeScript, `P` pour le processus), `Priorité`, `Taille`, `Paquet` (miroirs des labels,
remplis par automatisation). Vues : tableau par Status, feuille de route par milestone, « à valider ».

**Branches** : `<type>/<issue>-<slug>`, minuscules : `fonction/142-cluster-gap`, `tâche/155-hook-pre-push`
(types : `fonction`, `bogue`, `tâche`, `doc`, `chantier`). Une branche =
une issue = une PR. Commits en Conventional Commits avec `Refs #142` ; la PR porte `Closes #142`.

**Chaîne** : issue (assignee, labels, projet, milestone, description complète) → branche → commits →
PR → fusion → issue fermée → carte `fait`. Un seul contrôle CI refuse une PR sans `Closes` ou `Refs`.

## 3. Modèles

Formulaires `.github/ISSUE_TEMPLATE/*.yml`, champs obligatoires, issues vierges désactivées :

- **Fonction** : contexte, besoin, critères d'acceptation (cases), paquets, accessibilité, hors périmètre.
- **Bogue** : version, environnement, étapes, obtenu, attendu, preuve, régression depuis (SHA ou PR).
- **Tâche** : objectif, fichiers autorisés (`files:`), commande d'acceptation, `depends_on`, taille.
- **Rattrapage** : lot, SHA, PR, date, périmètre livré, écarts connus, lien `docs/lots/Lx.md`.
- **Sous-issue** : corps de « Tâche » ; le parent (`type:chantier`) liste ses enfants en cases.
- **PR** (`pull_request_template.md`, lignes ≤ 90 colonnes) : `Closes #`, quoi et pourquoi (3 lignes),
  commandes vérifiées avec sortie, risques et retour arrière, effet sur l'API publique (version).

## 4. Rattrapage L0 à L20

Une issue par lot, créée **fermée**, `type:rattrapage`, milestone `M-histoire`, corps tiré de
`docs/lots/Lx.md`, SHA et PR en référence. Aucun commit n'est réécrit.

L0 #1 `13bd245` ; L1 #2 `8e932d9` ; L2 #3 `023e6dd` ; L3 #5 `aaf4560` ; L4 #6 `e712b04` ;
L5 #7 `7e158cb` ; L6 #10 `915de13` ; L7 #11 `6c8f99a` ; L8 #9 `857e5f7` ; L10 #13 `5dbdd10` ;
L11 #14 `4d5ce00` ; L12 #15 `5a08edc` ; L13 + L14 #17 `a0d9adc` ; L15 + L16 #19 `4068766` ;
L17 #21 `d2102e1` ; L18 + L19 #22 `9bf2616` ; L20 #24 `2585f1c`. L9 : issue **ouverte** (paquets
non publiés, aucun commit).

Les lots à deux numéros donnent deux issues vers le même SHA. Hors lot, une issue fermée chacune : #4 (9d43175), #12 (d0e5142), #23 (7bd1518), #25 (9c426eb), #26 (a1aa102), #30 (fc43ef4). #27 et #28
(dependabot) restent sans issue. Ordre : labels et milestones, Project, issues, rattachement des PR.

## 5. `main` seule + previews Cloudflare, ou `develop`

- **`main` seule** : une étape (PR → `main`) ; release-please sur `main` ; dist-tags `next` à chaque
  fusion et `latest` à la release ; URL de preview dans la PR ; un déploiement Pages par PR, nettoyé
  seul ; risque : `main` instable si la CI est faible, d'où un ruleset ; « jamais main » devient
  « jamais sans PR verte ».
- **`develop` + `main`** : deux étapes, dont `develop → main` jamais faite ; pas de canal npm
  intermédiaire ; aucune revue visuelle avant `develop` ; deux suites de CI par changement ; filet
  redondant avec un ruleset.

**Recommandation : `main` seule.** `develop` ne fait aujourd'hui qu'ajouter une étape manuelle.
Conditions : ruleset sur `main` (PR obligatoire, CI `ci` requise, pas de push forcé, historique
linéaire) ; preview Cloudflare Pages par PR pour `apps/docs` ; release-please avec un tag par paquet ;
la PR de release fusionnée par Paul seul. Séquence : geler `develop`, la fusionner dans `main`,
changer la branche par défaut, retarger dependabot, supprimer `develop` après accord de Paul.
`ci`, `visual`, `supply-chain`, `dependabot-automerge` ciblent `develop` : tâche A5.

## 6. Découpage du reste (chaque ligne = une future issue, une session Sonnet)

Étapes 2 à 11 absentes du dépôt (ADR-0005 : `create`, `tools/agents`, `mcp`) : numérotation reconstruite.

- **A1** (page, processus) : script `gh` rejouable : milestones, labels, champs du Project.
- **A2** (page, processus) : modèles d'issue et de PR, `config.yml`, `SECURITY.md`, `CODEOWNERS`.
- **A3** (page, processus) : les 21 issues de rattrapage et les 6 hors lot, fermées, dans le Project.
- **A4** (page, ci) : ruleset `main` ; contrôle CI « PR liée à une issue ».
- **A5** (cahier, ci) : workflows vers `main`, preview Cloudflare, dependabot ; à découper en A5a-c.
- **A6** (trait, ci) : supprimer `develop` et `feat/ts-strict-guards`, après accord de Paul.
- **1bis-a** (trait, ci) : hooks réduits à `commit-msg` et lint-staged ; ni `pre-push` ni `check:size`.
- **1bis-b** (page ×3, guards, docs, mcp) : Windows : `check-tokens` en `node:path/posix` (17 échecs),
  e2e `COMPONENT_PAGES` vide (7), `check:mcp-data`, `check:pack` ; une issue chacun.
- **1bis-c** (page ×2, ci) : Visuel : snapshots mobiles absents (à produire en CI Linux) ; écarts de
  pixels bureau et tablette (polices, animations, seuil).
- **1bis-d** (page, ci) : matrice « qui vérifie quoi » (hook, `verify`, CI), suppression des doublons.
- **2a-c** (page, create) : TS strict : lib et `parseArgs`, `add` et `eject`, `diff` et `bin`.
- **3a-c** (page, agents) : `tools/agents` en TS strict, avec `config.json` et `.kiro/agents`.
- **4a, 4b** (page, mcp) : `mcp` en TS strict, sept outils sur deux sessions.
- **5** (page, tokens) : `tokens` et `create` publiés compilés (`dist`, condition `development`).
- **6** (page ×2, tokens, create) : accent et police chacun en une variable (`--pp-accent`,
  `--pp-font-sans`, teintes dérivées en OKLCH, test d'override), puis option `--accent` de `create`.
- **7** (page, ci) : release-please, un tag par paquet, `CHANGELOG`, dist-tags `next` et `latest`.
- **8** (cahier, docs) : première publication `0.x` (geste de Paul), puis L9 (portfolio).
- **9** (page, docs) : images OG, défaut connu : corriger ou retirer les balises.
- **10** (cahier, tokens) : Rust `pp-color` (ADR-0005 étape A), seulement sur décision explicite.

## Points à valider par Paul

1. Suppression de `feat/ts-strict-guards` (locale et distante ; #29 fermée, remplacée par #30) : **non faite**.
2. `main` seule ou `develop` conservée (section 5).
3. Numérotation des étapes (section 6). 4. Labels avec accents (`tâche`) ou ASCII (`tache`).
