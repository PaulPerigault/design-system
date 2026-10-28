# Proposition F1 : fondations du processus

Décisions de Paul validées le 2026-10-27 (voir « Décisions validées » en fin de fichier). Rien n'a été créé sur GitHub.

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
| `type:`   | `fonction`, `bogue`, `tache`, `rattrapage`, `decision`, `doc`, `accessibilite`, `chantier` |
| `pkg:`    | `tokens`, `css`, `astro`, `guards`, `create`, `mcp`, `docs`, `agents`, `ci`, `processus`   |
| `prio:`   | `bloquant`, `haute`, `normale`, `basse`                                                    |
| `taille:` | `trait` (≤ 30 min), `page` (une session Sonnet), `cahier` (à découper, jamais assignée)    |
| `etat:`   | `a-valider` (attend Paul), `bloque` (cite l'issue bloquante)                               |

**Milestones** : `M-histoire` (L0 à L20, fermé), `M0 fondations`, `M1 TypeScript strict`,
`M2 publication npm 0.x`, `M3 migration du portfolio (L9)`, `M4 Rust pp-color (conditionnel)`, `M5 1.0`.

**Project « design system »** (un seul, tout le projet ; les commits apparaissent par leur PR) :
champs `Status` (`à trier`, `prêt`, `en cours`, `en revue`, `fait`), `Lot` (`L0`…`L20`, `T` pour le
chantier TypeScript, `P` pour le processus), `Priorité`, `Taille`, `Paquet` (miroirs des labels,
remplis par automatisation). Vues : tableau par Status, feuille de route par milestone, « à valider ».

**Branches** : `<type>/<issue>-<slug>`, minuscules : `fonction/142-cluster-gap`, `tache/155-hook-pre-push`
(types : `fonction`, `bogue`, `tache`, `doc`, `chantier`). Une branche =
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

## 5. `main` seule + previews Cloudflare (décision validée)

Modèle retenu : **`main` seule**, une preview Cloudflare Pages par PR pour `apps/docs`, versionnement par
release-please (un tag par paquet) et dist-tags npm (`next` à chaque fusion, `latest` à la release).
Ruleset sur `main` : PR obligatoire, CI `ci` requise, pas de push forcé, historique linéaire. La PR de
release est fusionnée par Paul seul. `develop` est supprimée à l'étape F2a, pas avant ; tant que `main`
n'existe pas, les PR visent `develop`. Les workflows `ci`, `visual`, `supply-chain` et
`dependabot-automerge` ciblent `develop` : ils basculent à l'étape F2a.

Écarté : `develop` + `main` (deux étapes dont `develop → main` jamais faite, pas de canal npm
intermédiaire, deux suites de CI par changement).

## 6. Ordre des étapes (validé par Paul, 2026-10-28)

Chaque ligne = une future issue, une session Sonnet. Ordre d'exécution :

1. **1bis-b2** (Windows, Visuel) : `npm test` (17 échecs, chemins `node:path`), `check:data` (props vides :
   nom de fichier virtuel TypeScript avec `\`), `check:pack` (redirection `> /dev/null` de `cmd.exe`), e2e
   `COMPONENT_PAGES` vide (`readdir` renvoie des `\`), références Visuel Linux, Visuel exigé par `ci` sur
   les PR de rendu. Faite ; reste 1bis-d (matrice « qui vérifie quoi »).
2. **F2a** (page, processus) : Project, labels, milestones (script `gh` rejouable), ruleset `main`,
   workflows vers `main`, preview Cloudflare, dependabot, bascule vers `main`, puis suppression de
   `develop` après accord de Paul. À découper en sous-issues.
3. **F2b** (page, processus) : modèles d'issue et de PR, `config.yml`, `SECURITY.md`, `CODEOWNERS`, contrôle
   CI « PR liée à une issue », les 21 issues de rattrapage et les 6 hors lot, dans le Project.
4. **Étape 2** : ADR Architecture ; décision D-030 (politique Rust) ; réexamen de la décision d'ADR-0005
   sur les garde-fous.
5. **Étape 7**, en deux sessions : **7a** crate `pp-color` (OKLCH ↔ sRGB, gamut) et tests ; **7b** contraste
   WCAG 2 de la crate, erreurs typées, parité avec `@paulperigault/tokens` en CI.
6. **Lot analyse de données (BI)** :
   - **V1** : ADR visualisation (contrat de données, accessibilité, palettes sûres pour le daltonisme
     dérivées des jetons).
   - **V2a** : graphiques SVG statiques Astro sans JS : courbe, barres. **V2b** : aire, jauge.
   - **V3a** : KPI et sparklines. **V3b** : tableaux, légendes, filtres.
   - **V4a** : crate `pp-data` en Rust (agrégation, quantiles, sous-échantillonnage). **V4b** : compilation
     en WebAssembly, paquet npm, parité en CI, budget de poids du `.wasm`.
   - **V5** : page de démonstration d'un tableau de bord BI.
7. **Étape 8** : paquet `@paulperigault/color` en WebAssembly.
8. **Étapes 3 à 6** (migrations TypeScript strict) : **3** guards (architecture) ; **4** `create` ;
   **5** `mcp` + générateur de tokens ; **6** `tools/agents`, puis `tsc` vers `dist/` pour chaque paquet
   publié (`tokens` y compris).
9. **Étapes 9 à 11** : **9** mesure du pipeline d'images ; **10** Green IT (budgets de poids, carbone, page
   Sobriété) ; **11** Renovate/Dependabot Cargo, documentation, bilan.

## Décisions validées (Paul, 2026-10-27)

1. `feat/ts-strict-guards` supprimée (locale et distante) : son contenu est dans `develop` via #30.
2. Modèle de branches : `main` seule, preview Cloudflare par PR, release-please et dist-tags npm.
   `develop` supprimée à l'étape F2a.
3. Numérotation des étapes 2 à 11 : celle de la section 6, dans l'ordre d'exécution du 2026-10-28.
4. Labels en ASCII, sans accents.
