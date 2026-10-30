# Historique : chantier architecture, TypeScript strict et Rust

Déplacé tel quel depuis `docs/run-report.md` (D-080). Entrées par PR du 2026-10-29 au 2026-10-30.

**Chantier « architecture, TypeScript strict et Rust » : étape 1 codée (2026-10-27), étape 2 faite (ADR-0006, D-037, issue #82, PR #117), V1 faite (ADR-0007, D-038, issue #93, PR #119), **V2-0 faite** (paquet `@paulperigault/dataviz`, D-039, issue #120, PR #122), **V2a-1 faite** (géométrie pure : échelles, graduations, LTTB, chemins ; D-040), **V2a-2 faite** (`LineChart`, jetons `--pp-chart-*`, D-041 ; fusionnée), **V2a-3 faite** (`BarChart`, briques communes avec `LineChart`, erreur `bar.too-many-categories`, D-042), **V2a-4 faite** (registre, pages de documentation, D-043) : **V2a faite** (issue #94, PR #129 pour V2a-4), **V2b faite** (`AreaChart` et `GaugeChart` : géométrie dans `dataviz` D-044, export, registre et pages D-045, issue #95, PR #133) ; **D1 faite** (skill de revue visuelle « Encre », D-046, issue #134, PR #136 ; revue des quatre graphiques dans `docs/design/revue-graphiques-v2.md`) ; **C1 faite** (build Cloudflare de la doc réparé : `prebuild` compile `dataviz`, job CI `docs` identique à la commande de Cloudflare, D-048, issue #137, PR #138) ; **D2 faite** (corrections de la revue des graphiques V2, D-049, issue #139, PR #140 : texte d'axe à 12,4 px à 375 px, valeurs des barres à 4,78:1 au moins, contour d'aire limité à la courbe supérieure, budgets tenus ; M2, libellés de catégories tronqués plus tôt, traité ensuite par D-053, #143) ; **V3a-1 faite** (partie pure de #96 dans `dataviz` : KPI et sparkline, D-050 ; PR « Refs #96 ») ; **V3a-2 faite** (composants `KpiCard` et `Sparkline`, registre, pages, D-051, issue #96 ; **V3a faite**) ; **V3b faite** (`DataTable` avec filtres `:has()` et `Legend`, D-052, issue #97) ; étape suivante : V4a (#98) ; #121 en attente d'une décision (`tmp/questions-paul.md`) ; l'étape 3 (#83), le skill de voix (#135) et le branchement des variables `--pp-accent-hue` et `--pp-font-stack` (#121) peuvent avancer en parallèle.**
Fusionnés dans `main` : #24 (images OG), #25 (ADR-0005), #26 (`packages/tokens` en TypeScript
strict). Étape 1 : `packages/guards` en TypeScript strict, **PR #30 fusionnée** (la PR #29 avait été fermée : un sujet de commit de la branche d'origine est refusé par commitlint). `tsc -p packages/guards` : 0 erreur ;
`packages/guards/**/*.ts` est dans `TS_STRICT_FILES` (ni `any`, ni `as`, ni `!`) ; options des
contrôles validées à la frontière (`lib/options.ts`, `lib/check.ts`). `guards` est publié compilé :
`dist/` par `tsc` (`prepack`), `exports` avec la condition `development` pour les sources du dépôt.
`tokens` reste publié en `.ts` : même limite (Node n'exécute pas de `.ts` sous `node_modules`), à traiter
au même titre avant publication, puis `packages/create` et `tools/agents` (qui doit aussi mettre à jour
`tools/agents/config.json` et les listes `.kiro/agents/*.json`). Le sujet de commit « wip: » est refusé
par commitlint : utiliser `chore: wip …`.
Sous Windows, `npm test` (1849 tests), `check:mcp-data`, `check:pack` et les e2e de pages passent
depuis 1bis-b2 (chemins `posix` à la source). Visuel : références Linux versionnées, exigé par `ci` sur
les PR de rendu (`docs/process/visual-references.md`).

**Étape F1 (2026-10-27) :** proposition de processus dans `docs/process/proposal-foundations.md`, validée par Paul (F1b) ; rien créé sur GitHub.

**Ordre validé par Paul (2026-10-28)** (`docs/process/proposal-foundations.md` §6) : 1bis-b2, F2a, F2b,
étape 2 (ADR Architecture, D-030), puis étape 7 en deux sessions (crate `pp-color`) en parallèle de V1 à V3
(lot analyse, sans dépendance à `pp-color`), V4a après l'étape 7b (crate `pp-data`), étape 8 (`@paulperigault/color` en WebAssembly), étapes 3 à 6 (TypeScript strict),
étapes 9 à 11. Modèle : `main` seule, preview Cloudflare par PR (D-027).

1. **1bis-a, 1bis-b1 : faites** (D-028, D-029, `docs/process/ci-audit.md`). **1bis-b2 : faite** (tests
   Windows, références Visuel Linux, Visuel dans `ci`, D-030). Reste 1bis-d (matrice « qui vérifie quoi », issue « [1bis-d] »).
   **F2a-3 : faite côté dépôt** (D-036, issue #79, PR #115 ; reste `tofu apply` et le secret par Paul, `docs/manual-steps.md` §11).
   **Étape 2 faite** (ADR-0006, #82). **Étape suivante : étape 3** (#83) et en parallèle V1 (#93), puis V2 et V3 en parallèle de la crate `pp-color`
   (V1, #93, ne dépend plus de l'étape 7b ; seule V4a, #98, la garde).
2. **F2a-1 : faite** (Project n° 13, 28 labels versionnés et synchronisés, D-031,
   `docs/process/github-setup.md`). Reste à Paul : options de `Status`, milestones, vues et workflows du
   Project (`docs/manual-steps.md` §7). **F2a-2 : faite** (`develop` renommée en `main` par Paul, workflows,
   Dependabot, garde de fusion, D-032, PR #37) ; reste à Paul le ruleset et les options du dépôt
   (`docs/manual-steps.md` §8). **F2a-3** : previews Cloudflare (`tofu apply` par Paul),
   puis F2b. Références Visuel :
   mesurées après D2 : 210 PNG, 52 524 Ko sur disque (≈ 51 Mo) dans `apps/docs/e2e/references` ; seuil de
   réexamen Git LFS à environ 100 Mo, d'ici là réduire la zone capturée plutôt que relever un budget.
3. **F2b** : F2b-1 faite (modèles d'issue et de PR, D-033, `docs/process/templates.md`, issue
   « [F2b-1] »). F2b-2a faite (issues #42 à #66, D-034, `docs/history/catch-up.md`). **F2b-2b faite**
   (D-035) : une étape = une issue, `docs/history/roadmap-issues.md` donne étape, issue, milestone et
   dépendances ; **Paul lance `powershell -ExecutionPolicy Bypass -File tmp/create-roadmap-issues.ps1`**
   (appels `gh` d'écriture refusés à l'agent), puis les numéros sont ceux de l'issue de chaque étape.
   Étape F2a-3 : previews Cloudflare, jeton de release-please.
4. **Ensuite** (chacune a son issue, jalon et dépendances dans `docs/history/roadmap-issues.md`) :
   F2a-3, 1bis-d, étape 2 (M1), étape 7 (7a, 7b ; M4), lot BI (V1, V2a, V2b, V3a, V3b, V4a, V4b, V5 ;
   M-analyse), étape 8 (M4), étapes 3 à 6 (M1), étape 9 (M4), étapes 10 et 11 (M5). L9 : #51 (M3).
   Chaque PR porte `Closes #n`.

**Analyse de données (BI) :** V1 à V3 en parallèle de l'étape 7, V4a après l'étape 7b (V1 à V5) ; Rust sans preuve de gain de
performance (D-030).

## #121-B1 (2026-10-29) : palettes déplacées dans `tokens`

- La dérivation (`derivePalettes`, `lightDarkTokens` et leurs briques) vit dans `@paulperigault/tokens/palette` ; `@paulperigault/dataviz` la réexporte, API inchangée. Tests déplacés, assertions inchangées. Décision D-055.
- Reste (B2, PR suivante) : `--pp-accent-hue` et `--pp-font-stack`.

## #121-B2 (2026-10-29) : entrées du build de `tokens`

- `--pp-accent-hue` et `--pp-font-stack` branchés dans le build (`parseBuildInput`, `deriveOverrides`, export `./customize`, CLI avec `--out-dir`). Défaut identique octet pour octet. Neuf codes d'erreur `build.*`. Décision D-056.
- Reste : `create` (bloqué par le `.ts` publié, voir D-056), émission des rampes ; suivi de `focus` et `status-running` fait en B3 (D-057).

## #121-B3 (2026-10-29) : focus et statut « en cours » suivent la teinte

- `--pp-color-focus` et `--pp-color-status-running` dérivés de la teinte (`deriveRoles`), contrôle bloquant sur la valeur émise (focus 3:1, statut 4,5:1, fond et surface), code `build.role-contrast-failed`. Défaut identique octet pour octet. Décision D-057 ; dernière PR de #121.
- Reste : rampes `seq`/`div` non émises ; `create` (issue séparée, bloquée par #86).

## #135 (2026-10-29) : skill de voix Encre

- `.claude/skills/encre-voix/SKILL.md`, `.agents/product-marketing.md`, essais dans `docs/design/voix-essais.md` (accueil, README ; non appliqués). Choix de Paul dans D-058.
- Reste : #123 applique la voix aux pages et traite les écarts relevés (paquets, Visuel, `proofs.json`).

## #83-A (2026-10-29) : `guards` en domain, application, infrastructure

- Structure de l'ADR-0006 appliquée à `guards` (D-059), déplacement seul, tests et sorties identiques.
- Reste : B, le contrôle d'architecture (« Closes #83 »), puis #84, #85, #86.

## #83-B (2026-10-29) : contrôle `architecture`

- Règle de dépendance vers l'intérieur en contrôle testé, branché sur `guards` (D-060). #83 fermée.
- Reste : #84 (`create`), #85 (`mcp`, générateur de `tokens`), #86 (`tools/agents`, `dist/`).

## #84-A (2026-10-29) : `create` en TypeScript strict

- 16 sources en `.ts`, JSON validés à la frontière, `TS_STRICT_FILES` étendu (D-061). Tests et sorties identiques.
- Reste : B (structure en anneaux, `errors.ts`, « Closes #84 »), puis #85, #86.

## #84-B (2026-10-29) : `create` en anneaux, erreurs typées

- Structure de l'ADR-0006 appliquée à `create` (D-062), contrôle `architecture` étendu à `create`. #84 fermée.
- Reste : #85 (`mcp`, générateur de `tokens`), #86 (`tools/agents`, `dist/` pour chaque paquet publié).

## #85-A (2026-10-29) : `mcp` en TypeScript strict

- `mcp` en TypeScript strict, sorties identiques (D-063). Anneaux : ⚖️ (garde statique à neuf modules). #85 reste ouverte.
- Reste : #86 (`tools/agents`, `dist/` pour chaque paquet publié).

## #86-A (2026-10-29) : `dist/` pour `tokens`, `create` et `mcp`

- Les trois paquets sont compilés vers `dist/` comme `guards` et `dataviz` (D-064). Lockfile non resynchronisé (refus d'écriture, commande dans les questions).
- Reste : B (`tools/agents` en TypeScript strict), puis l'issue `[Tokens] create`.

## #86-B1 (2026-10-29) : `tools/agents`, modules feuilles

- 17 modules en TypeScript strict (D-065). Restent : modules à dépendances (B2), scripts et configuration (B3, « Closes #86 »).

## #86-B2 (2026-10-29) : `tools/agents`, modules à dépendances

- Huit modules en TypeScript strict (D-066). Reste : B3, les six lanceurs et la configuration (« Closes #86 »).

## #86-B3 (2026-10-29) : `tools/agents`, lanceurs

- Les lanceurs passent en TypeScript strict, commandes mises à jour (D-067). #86 fermée.
- Reste : issue `[Tokens] create`, #123, #131, Rust, #102, #103, #130, #118.

## #151 (2026-10-29) : `create`, teinte d'accent et pile de police

- `--accent-hue` et `--font-stack` dans `create`, dérivation embarquée sans dépendance (D-068). #151 fermée.
- Reste : #123 (refonte du site), #131, Rust, #102, #103, #130, #118.

## #164 (2026-10-29) : audit du site et ADR-0008

- Audit chiffré et décision de refonte (D-069). Sous-issues suivantes : accueil, démarrer, textes, navigation, données. Tests avec visiteurs : manuel (Paul).

## #166 (2026-10-29) : accueil du site

- Accueil avec démonstration vivante sur le journal des décisions (D-070). Reste : démarrer (#167 à créer), textes, navigation, données, tests visiteurs (Paul).

## #168 (2026-10-29) : page « Utiliser »

- Démarrage en cinq minutes et réglage de l'accent (D-071). Reste de #123 : textes, navigation, données, tests visiteurs (Paul).

## #170 (2026-10-29) : textes d'architecture et d'auteur

- Écarts de l'audit corrigés, page auteur au « je » (D-072). Reste de #123 : données, navigation (⚖️), tests visiteurs (Paul).

## #85, self-test de `mcp` (2026-10-30)

- `alternative` et `rollback` optionnels, `pp-mcp --self-test` dans `npm run verify` (D-073). Reste : anneaux de `mcp` (#85).

## #85, mcp en anneaux (2026-10-30)

- `domain`, `application`, `infrastructure` et erreurs typées, `architecture` sur `packages/mcp/src` (D-074). #85 fermée. Reste : issue `[Tokens] create`, #123, #131, Rust, #102, #103, #130, #118.

## #87, condition d'export à nom propre (2026-10-30)

- `development` remplacée par `@paulperigault/source` dans `tokens`, `dataviz`, `guards`, activée pour TypeScript, Vitest et Astro (D-075). Tests inchangés, tous verts. Reste : trois issues (agents, CI, Design).

## #178, skill encre-processus (2026-10-30)

- Règles de livraison réunies avec leurs sources (D-076, « Refs #178 »). Reste : `encre-securite`, puis mobile, greenops, rust et l'index d'`AGENTS.md`.

## #178, skill encre-securite (2026-10-30)

- Revue de sécurité avec sources et niveaux de preuve (D-077, « Refs #178 »). ANSSI à vérifier. Reste : mobile, greenops, rust et l'index d'`AGENTS.md`.

## #178, skill encre-mobile (2026-10-30)

- Revue mobile à 375 px avec sources et niveaux de preuve (D-078, « Refs #178 »). Reste : greenops, rust et l'index d'`AGENTS.md`.

## #178, skill encre-greenops (2026-10-30)

- Sobriété numérique mesurée, jamais bloquante, méthodes carbone sourcées sans en retenir (D-079, « Refs #178 »). Reste : rust et l'index d'`AGENTS.md`.
