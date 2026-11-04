# Audit de propreté du dépôt (2026-11-04)

Mesure et plan, sans aucune correction : rien n'a été modifié dans le code, les commentaires, les textes, les issues, le Project ni les jalons. Objectif de Paul : un dépôt tenu comme s'il avait un PO, un tech lead et un architecte. Décision : D-160. Issues de suivi : voir §7.

Niveaux de preuve : **mesure** (script du dépôt, reproductible), **lecture** (`gh` ou fichier lu), **heuristique** (candidats lexicaux, relecture humaine requise), **[À VÉRIFIER]** (non lisible ici).

## 1. Résumé

| Axe                      | Constat mesuré                                                                                                                                        | Gravité   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Traçabilité PR → issue   | 118 PR sur 118 attendues portent un lien d'issue ; 4 PR de mise en place (#38, #39, #41, #67) n'en ont pas                                            | faible    |
| Traçabilité commit → PR  | 0 commit de `main` depuis #37 porte « (#n) » valide ; 106 sont reliés à leur PR par le SHA, 16 portent un numéro d'issue                              | moyenne   |
| Project 13               | 128 PR sur 155 hors Project ; 71 issues sans `Status` ; 96 issues fermées sur 110 pas à `Fait` ; 17 issues sans Début ni Échéance                     | élevée    |
| Jalons                   | 8 jalons sur 8 sans date d'échéance                                                                                                                   | élevée    |
| Issues                   | 2 titres hors convention, 15 sous-issues non rattachées à leur parent, 25 issues sans `prio:`, 4 parents prêts à fermer                               | moyenne   |
| Commentaires de code     | 2 418 commentaires ; 53 à reformuler (références de conversation), 2 à supprimer, 79 renvois D-xxx ou ADR ; qualité d'ensemble bonne                  | faible    |
| Fichiers inutiles        | Aucun fichier suivi à supprimer sur preuve ; 613 Ko de fiches `tasks/` archivables ; une dépendance à confirmer                                       | faible    |
| Gouvernance, open source | pas de CONTRIBUTING, de CODE_OF_CONDUCT ni de CODEOWNERS ; README racine et 6 README de paquets annoncent « rien n'est publié » alors que 0.1.0 l'est | **haute** |
| Description du dépôt     | topics vides, page d'accueil vide, profil communautaire GitHub à 71 %                                                                                 | moyenne   |

Le point le plus visible pour un lecteur extérieur est le dernier : les README s'affichent sur npm et contredisent l'état publié (§6).

## 2. A. Traçabilité (mesure)

Script : `npm run audit:traceability` (`tools/github/audit-traceability.mjs`, lecture seule, jamais bloquant ; `--all` liste tout, `--json` donne le brut). Il lit 161 PR, 156 commits de `main`, 127 issues, 154 éléments du Project 13, 13 branches, 8 jalons. Les PR de release-please (#40) et de Dependabot (2) sont **exemptées** : aucune issue par conception. Limite de la période historique : PR #37 (bascule vers `main` seule, SHA `eed2618`).

| Contrôle                                  | Résultat                                                                                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PR fusionnées ou ouvertes avec issue liée | 118 (lien GitHub ou ligne `Closes` ou `Refs`)                                                                                                                            |
| PR avant #37 couvertes par le rattrapage  | 30 sur 30 citées par `docs/history/catch-up.md` ou une issue de #42 à #66 ; **0 orphelin historique**                                                                    |
| PR sans issue après #37                   | 4 : #38 ruleset, #39 modèles, #41 historique, #67 issues de F2b-2b (créées avant les issues)                                                                             |
| PR fermées sans fusion                    | 6 (#8, #16, #18, #20, #29, #116)                                                                                                                                         |
| Commits historiques (jusqu'à `eed2618`)   | 33 couverts par le rattrapage, 0 orphelin                                                                                                                                |
| Commits depuis #37                        | 123 : 106 sans suffixe, PR retrouvée par `mergeCommit` ; 16 avec un suffixe qui est un numéro d'issue ; 1 exempt                                                         |
| Branches                                  | 13 : `main` (locale et distante), 0 orpheline, 7 branches `lot/*` fusionnées et non supprimées, 3 fermées sans fusion non supprimées, 1 branche Dependabot sur `develop` |

Constats :

1. **Le suffixe « (#n) » n'existe plus.** `AGENTS.md` écrit que GitHub l'ajoute au squash ; avec `--subject` il ne l'ajoute pas. La liaison reste sûre par le SHA (`pull.mergeCommit`), mais `git log` seul ne dit pas la PR. Option : écrire « (#n) » dans `--subject` (titre ≤ 72 caractères **avec** le suffixe). ⚖️ Q-A1.
2. **16 commits portent un numéro d'issue** (#83 à #86, #135, #151, #164 à #170) : PR fusionnées sans squash avant le ruleset. Les commits ne se réécrivent pas ; l'écart est documenté ici.
3. **Nom de branche** : 103 PR sur 161 suivent `<type>/<n>-<slug>`. Sur les 119 PR depuis #67, 16 s'écartent (13 %), toutes dans #116 à #140, plus #172 et #274. `github-setup.md` cite `fonction/142` et `tache/155`, la pratique est `docs/`, `feat/`, `fix/` (types Conventional Commits). C'est la pratique qui doit gagner (`gouvernance.md`).
4. Les 10 branches `lot/*` (7 fusionnées, 3 fermées sans fusion) et la branche Dependabot `develop` sont des restes de la période avant ruleset (`delete_branch_on_merge` est actif depuis). Suppression : commande dans le plan §7, jamais appliquée ici.

## 3. B. Issues et Project (mesure et lecture)

127 issues : 17 ouvertes, 110 fermées. Sont conformes sur toutes les issues : assignée à `PaulPerigault`, un label `type:`, `pkg:` et `taille:`, un jalon, présence dans le Project (127 sur 127).

| Anomalie                               | Nombre | Détail                                                                                                                                                                                       |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Status` vide                          | 71     | 62 fermées, 9 ouvertes                                                                                                                                                                       |
| Fermée mais `Status` ≠ `Fait`          | 96     | 62 vide, 29 `A trier`, 4 `Pret`, 1 `En cours`. Seules 14 fermées sont à `Fait`                                                                                                               |
| `Début` et `Échéance` vides            | 17     | #245, #246, #249, #256, #258, #260, #262, #264, #266, #269, #273, #275, #277, #278, #281, #283, #285 : créées depuis le 2026-11-02, après la génération de `roadmap-dates.json` (110 issues) |
| Label `prio:` absent                   | 25     | #42 à #66, issues de rattrapage ; #51 et #66 incluses                                                                                                                                        |
| Parent cité dans le corps mais non lié | 15     | #164, #166, #168, #170, #187, #206 à #211, #245, #246, #249, #273                                                                                                                            |
| Titre hors « [Thème] sujet »           | 2      | #273 `tache: mesure outillée…`, #281 `tache: [Publication]…` (préfixe du formulaire resté)                                                                                                   |
| PR hors Project                        | 128    | 27 PR sur 155 seulement y figurent                                                                                                                                                           |
| Doublons                               | 0      | titres normalisés tous distincts                                                                                                                                                             |

**Titres.** La convention réelle est « [Thème] sujet » (125 sur 127). Les thèmes sont hétérogènes (73 libellés : `L0` à `L20`, `F2a-1`, `Étape 7b`, `V4a`, `Site`, `CI`…) parce qu'ils reflètent la période. Écart écarté : renommer l'historique ; seuls #273 et #281 se corrigent.

**Corps.** 122 issues sur 127 suivent une famille de modèle (`Contexte / Objectif / Critères`, `… / Fichiers autorisés`, `… / Périmètre livré / Références` pour le rattrapage, `Lot / SHA de fusion / PR d'origine`, `… / Sous-issues`). 5 s'en écartent (#66, #83, #84, #118, #137 : sections `Périmètre (ADR-0006…)`, `Constat / Cause`, ou corps écrit sur une seule ligne).

**Parents prêts à fermer** (critères lus dans le corps le 2026-11-04 ; sous-issues lues par l'API) :

| Issue | Cases | Sous-issues ouvertes | Verdict                                                                                                                                              |
| ----- | ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| #87   | 5/6   | 0 sur 5              | **Fermable** : reste « toutes les sous-issues sont fermées », vraie                                                                                  |
| #92   | 4/5   | 0 sur 4              | **Fermable**, même case                                                                                                                              |
| #101  | 8/9   | 0 sur 9              | **Fermable**, même case                                                                                                                              |
| #104  | 2/3   | 0 sur 2              | **Fermable**, même case                                                                                                                              |
| #269  | 0/3   | 0                    | **Fermable après relecture** : section écrite par la PR #270 ; cocher `verify` demande la CI de #270 (verte)                                         |
| #66   | 23/24 | 1 (#51)              | **Ne se ferme pas** : #51 (migration du portfolio) est exclue                                                                                        |
| #114  | 8/10  | 1 (#110)             | **Ne se ferme pas** : #110, lecteurs d'écran, revient à Paul                                                                                         |
| #264  | 0/7   | 0                    | **Ne se ferme pas** : durée des journaux (Q18) et article 47 (Q19) attendent Paul                                                                    |
| #123  | 0/9   | 0                    | **Ne se ferme pas** : neuf cases jamais cochées malgré #164 à #170, #187 ; tests visiteurs (case 9) non faits. Cases à relire une à une [À VÉRIFIER] |

**Sous-issues.** Seules les 9 issues `type:chantier` ont des sous-issues liées par l'API (24 pour #66). Les 15 issues « parent non lié » citent un parent dans leur corps sans lien GitHub : liaison possible par `gh api -X POST repos/PaulPerigault/design-system/issues/<parent>/sub_issues -F sub_issue_id=<id>`.

**Dates.** Les dates des issues fermées doivent être factuelles (création, fermeture : `gh issue list --json createdAt,closedAt`). Exception à décider ⚖️ Q-B2 : les 25 issues de rattrapage (#42 à #66) portent aujourd'hui le 2026-10-28 (leur création) alors que les lots ont été livrés du 2026-10-20 au 2026-10-24 (`catch-up.md`) ; la date factuelle du travail est celle de la PR. Les dates des 17 issues ouvertes sont des **estimations** (rythme observé, `github-setup.md`), marquées comme telles dans `.github/roadmap-dates.json` (`"kind": "estimate"`).

**Plan de correction (non appliqué).** Chaque commande est complète ; les identifiants du Project se lisent avec `gh project field-list 13 --owner PaulPerigault --format json`.

```shell
# 1. Titres (corps inchangé)
gh issue edit 273 --title "[Site] mesure outillée de proofs.json"
gh issue edit 281 --title "[Publication] tester le paquet publié hors du dépôt"
# 2. Parents fermables : cocher la dernière case (corps lu depuis un fichier UTF-8), puis fermer
gh issue edit 87 --body-file tmp/corps-87.md && gh issue close 87 --reason completed
# (idem 92, 101, 104 ; 269 après relecture)
# 3. Dates : compléter .github/roadmap-dates.json (kind fact ou estimate), puis
node tools/github/sync-project-dates.mjs --apply
# 4. Status des fermées : pour chaque item fermé (96)
gh project item-edit --id <item> --project-id <projet> --field-id <Status> --single-select-option-id <Fait>
# 5. Labels prio: sur #42 à #66 (si ⚖️ Q-B3 = oui)
gh issue edit 42 --add-label "prio:basse"
# 6. Sous-issues non liées : voir la commande ci-dessus
```

Anomalie de l'outil : `node tools/github/sync-project-dates.mjs` (dry-run) propose 126 réécritures d'`Échéance` à chaque lancement. `gh project item-list` renvoie la clé du champ avec une initiale abîmée ; `project-io.mjs` lit `échéance` et voit toujours une valeur vide, donc le script n'est plus idempotent. L'audit lit le champ par nom normalisé (`field` dans `tools/github/traceability/issue-rules.mjs`). Correction : issue #290, non appliquée ici.

Cause racine des 96 `Status` : le workflow du Project « item fermé → Fait » n'est pas actif (étape manuelle `docs/manual-steps.md` §7.4, [À VÉRIFIER] dans l'interface). Sans lui, les corrections 4 se répètent à chaque issue.

## 4. C. Commentaires de code (mesure et heuristique)

Script : `npm run audit:comments` (`tools/audit/measure-comments.mjs`), échantillons : `npm run audit:comments -- --samples 30` (stockés dans `docs/audit-commentaires-echantillons-2026-11.md`). Il lit 1 069 fichiers suivis `.ts`, `.mjs`, `.astro`, `.rs`, `.css`, `.yml`, hors `tasks/`, références Visuel et `.agents/`. Les lignes consécutives forment un seul commentaire. Les chaînes sont sautées par expression régulière ; un littéral de regex contenant `//` peut être mal lu (1 cas constaté : `tools/links/external.mjs:12`).

**Totaux : 2 418 commentaires** (227 dans des tests).

| Langage       | Total | À supprimer | À reformuler | Garder (technique) | Garder |
| ------------- | ----- | ----------- | ------------ | ------------------ | ------ |
| TypeScript    | 1 346 | 0           | 32           | 76                 | 1 238  |
| Astro         | 405   | 0           | 2            | 29                 | 374    |
| script `.mjs` | 395   | 1           | 12           | 15                 | 367    |
| Rust          | 141   | 0           | 5            | 13                 | 123    |
| workflow YAML | 80    | 1           | 2            | 1                  | 76     |
| CSS           | 51    | 0           | 0            | 7                  | 44     |

Par catégorie : décision ou conversation (issue, PR, lot, tâche, date, nom, « confirmé ») 52 ; références D-xxx ou ADR 79 lignes (44 occurrences de D-xxx, 51 d'ADR, dont 19 lignes dans des tests) ; paraphrase 1 ; décoratif 1 ; tournure IA 1 ; JSDoc ou rustdoc redondant 0 ; TODO sans issue 0.

Par portée (reformuler / références) : `apps/docs` 19 / 8 ; `tools/agents` 9 / 4 ; `tools/benchmark` 6 / 0 ; `packages/dataviz` 2 / 6 ; `crates/pp-data` 2 / 5 ; `packages/create` 2 / 3 ; `.github/workflows` 2 / 13 ; `packages/mcp` 1 / 7 ; `packages/effect` 0 / 7 ; `packages/astro` 1 / 6 ; les autres moins de 3. Tableau complet : `npm run audit:comments`.

**Lecture critique de la mesure.**

- Le JSDoc d'un `.mjs` porte les types (pas de TypeScript) : il n'est pas redondant et est donc **gardé**. Une première passe l'avait classé à supprimer (73 cas) ; corrigée.
- Précision des 53 « à reformuler » : relecture des 30 échantillons, 28 sont de vraies références de conversation (« Choix de Paul », « Vide tant que Paul ne l'a pas renseignée », « issue #90 », « Repères de L12 ») ; 2 sont des faux positifs de motif (`seo.ts:22`, le nom de l'auteur dans un format de titre ; `keys.ts:10`, une date d'exemple).
- Rappel : 45 commentaires non signalés relus, 4 sont des paraphrases d'un identifiant (« Réservé au placement du composant dans son parent. » répété, « Racine du paquet astro installé. », « Copie de la file avec le lot `id` modifié. »). L'heuristique ne voit pas un identifiant camelCase. **Estimation : 4 sur 45 (9 %), soit 197 sur 2 222 non signalés, sont à relire** [À VÉRIFIER] ; intervalle large (45 échantillons).
- Constat qualitatif : les commentaires sont français, courts, techniques (norme citée, unité, invariant, contournement Windows). Pas d'emoji, pas de bannière, pas de TODO orphelin. Le défaut dominant est la **référence de provenance** (issue, lot, décision) en tête de fichier.

**Classes d'action.** À supprimer : décoratif, paraphrase, JSDoc ou rustdoc qui répète la signature TypeScript ou Rust. À reformuler : décision ou conversation (garder le fait technique, retirer « pourquoi nous l'avons décidé »). À garder : invariant, unité, contrainte, contournement, norme (WCAG, RFC, CSS Color 4).

**⚖️ Références D-xxx et ADR dans le code (79 lignes).** Option A : garder comme renvoi technique quand l'ADR définit la valeur utilisée (seuil, plafond : `limits.ts`, `thresholds.ts`, parité Rust) ; retirer quand la référence ne dit que « décidé le… » (en-têtes de `ci.yml`, `release.yml`). Option B : tout retirer, la décision se retrouve par `git blame`. Recommandation : A pour les renvois qui portent une valeur, B pour le reste. Q-C1.

**Plan de nettoyage.** Une PR par paquet (issues §7), sans changement de comportement : tests identiques, sorties générées identiques (`check:data`, `check:registry`), `docs.json` regénéré seulement si une page change. Ordre : `apps/docs` (19), `tools/agents` (9), `tools/benchmark` (6), `crates` (7), `packages/dataviz`, `create`, puis les paquets à une ou deux occurrences, enfin les workflows (2 à reformuler, 13 renvois à trancher). Taille : de 2 à 20 commentaires par PR, relecture ligne à ligne ; `taille:trait` partout sauf `apps/docs` (`page`).

## 5. D. Fichiers inutiles (passe plus stricte)

Base : `docs/process/nettoyage-2026-11.md` (D-143) : 1 735 fichiers, 0 suppression. Re-passe sur 1 755 fichiers suivis (+20 depuis).

| Contrôle                               | Méthode                                                                                                     | Résultat                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scripts npm sans appelant              | `git grep -F` du nom dans `.github`, `.husky`, `tools`, `package.json`, scripts d'app                       | 6 sur 38+ : `format` (manuel), `check:duplication` (manuel, D-103, hors CI), `agents:run` et `agents:batch` (cités par `CLAUDE.md`), `dev` de `apps/docs`, `prebuild` (cycle de vie). **Aucun à supprimer.** |
| Dépendances déclarées jamais importées | nom, `@types/` et binaire cherchés dans le dossier du paquet (script de travail, aucune dépendance ajoutée) | 1 : `@astrojs/check` (`apps/docs`), requis par `astro check` (script `check`, sans appelant CI). Garder ou brancher en CI ⚖️ Q-D1.                                                                           |
| Fichiers générés commités              | présence d'un contrôle qui les lit                                                                          | `docs.json`, `adr.json`, `components.json` (`check:mcp-data`), `registry.json` (`check:registry`), `proofs.json` (`proofs`). Tous lus. [À VÉRIFIER] pour les fichiers sous `apps/docs/public`                |
| Dossiers vides suivis                  | `git ls-files` (git ne suit pas les dossiers vides)                                                         | 0 ; 1 dossier vide non suivi et ignoré (`apps/docs/.astro/collections`)                                                                                                                                      |
| Config orphelines                      | relecture du tableau de D-143 (474 fichiers)                                                                | aucune nouvelle ; `.editorconfig` et `.secretlintrc.json` restent lus par des outils                                                                                                                         |
| Doublons de documentation              | `git grep -l` de règles clés dans `*.md` hors historique                                                    | « 120 lignes » dans 14 fichiers, « attribut `style` » dans 10, « squash » dans 12, `--subject` dans 4                                                                                                        |

**Doublons de règles.** `AGENTS.md` se déclare source unique, mais `encre-processus` (150 lignes) répète les sections Git, fusion et corps de PR, et `templates.md` répète la règle de titre. Un doublon est un risque de dérive (déjà arrivé : `github-setup.md` cite des types de branche abandonnés). Recommandation : les skills renvoient à la source (`AGENTS.md §Git`) au lieu de la recopier, en gardant la méthode. ⚖️ Q-D2.

**Archivage (sans suppression).**

| Dossier         | Fichiers | Taille | Références entrantes                                                                      | Proposition                                                      |
| --------------- | -------- | ------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `tasks/`        | 126      | 613 Ko | identifiants `T2.01`… dans `decisions-log.md`, journal, tests ; `batch.ts` lit le dossier | `git mv` vers `docs/archive/tasks/`, `.gitkeep` en place ⚖️ Q-D3 |
| `docs/lots/`    | 20       | 112 Ko | cités par `catch-up.md` et `templates.md`                                                 | garder                                                           |
| `docs/history/` | 7        | 64 Ko  | cités par `AGENTS.md`, `catch-up.md`                                                      | garder                                                           |
| `docs/journal/` | 13       | 188 Ko | cités par `AGENTS.md` et le processus                                                     | garder                                                           |

Tout déplacement exige de relire `batch.ts` (`readdir tasks`) et les tests qui citent un chemin ; hors preuve, rien n'est supprimé.

## 6. E. Gouvernance et dépôt prêt pour l'open source

| Élément                      | État (lecture)                                                                                                       | Écart                                                                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README racine                | 36 lignes, tableau des paquets, badges CI et Scorecard                                                               | « rien n'est encore publié » (ligne 28) est faux depuis 0.1.0                                                                                                                                         |
| README des 9 paquets         | `astro` 5 lignes, `css` 5, `tokens` 37, `color` 55, `data` 50, `dataviz` 75, `mcp` 138, `create` 155, `guards` 247   | 6 annoncent « en construction (0.0.0) » ou « non publié » ; `astro` et `css` sans installation ni exemple ; `effect` (privé) 6 lignes                                                                 |
| CONTRIBUTING                 | absent                                                                                                               | à écrire en renvoyant à `gouvernance.md`, `AGENTS.md`                                                                                                                                                 |
| CODE_OF_CONDUCT              | absent                                                                                                               | à choisir ⚖️ Q-E1                                                                                                                                                                                     |
| SECURITY.md                  | 32 lignes, signalement privé, objectif de réponse 7 jours, versions suivies                                          | « Les paquets sont en 0.x » correct ; rien à changer                                                                                                                                                  |
| CODEOWNERS                   | absent                                                                                                               | `* @PaulPerigault` suffit (un seul propriétaire)                                                                                                                                                      |
| LICENSE                      | MIT (reconnue par GitHub)                                                                                            | aucun                                                                                                                                                                                                 |
| Modèles d'issue et de PR     | 5 formulaires, `config.yml`, `PULL_REQUEST_TEMPLATE.md` (27 lignes)                                                  | le profil communautaire ne détecte pas les formulaires (`issue_template` nul)                                                                                                                         |
| Description, topics, accueil | description présente ; topics `[]` ; page d'accueil `null`                                                           | ajouter topics et `https://design.paulperigault.dev`                                                                                                                                                  |
| Règles de branche            | ruleset `main` actif (`.github/rulesets/main.json`), squash seul, historique linéaire, branche supprimée à la fusion | aucun                                                                                                                                                                                                 |
| Labels                       | 32 dans `.github/labels.json`, versionnés, synchronisés par script                                                   | pas de page qui les explique ; `gouvernance.md` les décrit                                                                                                                                            |
| CHANGELOG                    | générés par release-please, 1re version 0.1.0 (2026-11-04)                                                           | ils reprennent les sujets de commit en minuscules ; le CHANGELOG de `tokens` liste des entrées d'autres paquets (ex. `astro: composant linechart`) [À VÉRIFIER : cause dans la config release-please] |

**Texte qui sent l'IA** (grille `encre-voix`, recherche de « permet de », « vise à », « robuste », « moderne », « solution », « écosystème », « performant »… dans README, SECURITY et modèles) : 1 occurrence, `packages/create/README.md:109` (« permet de la déterminer »), légitime. Pas de superlatif, pas d'emoji, pas de formule creuse. L'écart du README est un écart de **véracité**, pas de ton.

`docs/process/gouvernance.md` (livré avec cet audit) fixe rôles, cycle de vie des issues, définitions de prêt et de fini, règle de traçabilité, cadence de revue de la Roadmap.

## 7. Plan, ordre et issues de suivi

Ordre recommandé (le premier débloque la lecture des autres) : **gouvernance et open source** (véracité des README, 1 PR), **traçabilité et Project**, **issues**, **fichiers**, puis **commentaires** par paquet. Toutes ces issues sont dans le jalon M5 1.0, assignées à `PaulPerigault`, dans le Project 13, dates marquées « estimation » (cadence observée de 10 à 15 PR par jour de travail).

| Issue                                     | Taille | Début      | Échéance   |
| ----------------------------------------- | ------ | ---------- | ---------- |
| Traçabilité et Project                    | page   | 2026-11-05 | 2026-11-06 |
| Nettoyage des issues                      | page   | 2026-11-06 | 2026-11-09 |
| Gouvernance et open source                | page   | 2026-11-05 | 2026-11-06 |
| Fichiers inutiles et archivage            | trait  | 2026-11-09 | 2026-11-10 |
| Commentaires, une issue par paquet (onze) | trait  | 2026-11-10 | 2026-11-20 |

Numéros : chantier parent #289 ; traçabilité #290 ; issues #291 ; gouvernance #292 ; fichiers #293 ; commentaires #294 (docs), #295 (agents), #296 (ci), #297 (color), #298 (data), #299 (dataviz), #300 (create, avec `packages/effect`), #301 (mcp), #302 (astro), #303 (tokens), #304 (guards). `css` : 16 commentaires, 0 candidat, pas d'issue. Les 15 sous-issues sont dans le Project 13 (`Status` à `A trier`, dates en estimation) ; leur liaison à #289 est refusée à l'agent (écriture par `gh api`), commande dans `tmp/commandes-paul.md`.

## 8. Questions ⚖️ (dans `tmp/questions-paul.md`, avec recommandation)

Points 22 à 31 : Q-A1 suffixe « (#n) » · Q-B2 dates factuelles du rattrapage · Q-B3 labels `prio:` du rattrapage · Q-C1 renvois D-xxx et ADR · Q-D1 `@astrojs/check` · Q-D2 doublons de règles · Q-D3 archivage de `tasks/` · Q-E1 code de conduite · Q-E2 PR dans le Project · 31 [À VÉRIFIER] automatismes du Project.

## 9. Limites

- Le Project n'est lisible que par `gh project item-list` (154 éléments) ; un élément sans contenu serait absent [À VÉRIFIER].
- Les statuts des workflows du Project (« item fermé → Fait », ajout automatique) ne sont pas lisibles par l'API : [À VÉRIFIER] dans l'interface.
- Les comptes de commentaires sont des candidats lexicaux ; seul l'échantillon relu (30 + 45) a un jugement humain, ici celui de l'auteur de l'audit, pas de Paul.
- La classification des 33 commits historiques repose sur `catch-up.md` ; le rattrapage de #36 à #39 est classé « hors périmètre » dans ce document.
