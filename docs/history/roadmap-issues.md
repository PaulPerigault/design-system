# Issues du chantier : étape, issue, milestone, dépendances

Décision D-035 : une étape = une issue, une PR avec `Closes #n`, des épiques et des sous-issues. Source :
`docs/process/proposal-foundations.md` §6 et `docs/run-report.md`. Les issues du rattrapage des lots
(L0 à L20) sont dans `docs/history/catch-up.md`.

Les numéros d'issue sont attribués à la création : Paul lance
`powershell -ExecutionPolicy Bypass -File tmp/create-roadmap-issues.ps1` (les appels `gh` d'écriture
sont refusés à l'agent). Le script affiche la correspondance clé → numéro en fin d'exécution et pose le
milestone, les labels, l'assignee, le Project 13 et les liens. Chaque épique liste ses sous-issues en
cases `- [ ] #n` ; le lien d'API « sous-issue » est tenté en plus.

Milestones : M0 fondations, M1 TypeScript strict, M2 publication npm 0.x, M3 migration du portfolio
(L9, #51, déjà ouverte), M4 Rust pp-color et pp-data, M5 1.0, M-analyse.

| Étape     | Issue (titre)                                                                                             | Jalon     | Bloquée par        |
| --------- | --------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| Étape 1   | [Étape 1] guards en TypeScript strict                                                                     | M0        | —                  |
| F1 et F1b | [F1 et F1b] proposition des fondations du processus                                                       | M0        | —                  |
| 1bis-a    | [1bis-a] audit de la CI : installation unique et hooks minimaux                                           | M0        | —                  |
| 1bis-b1   | [1bis-b1] CI : tests par pertinence                                                                       | M0        | —                  |
| 1bis-b2   | [1bis-b2] tests portables sous Windows, références Visuel Linux                                           | M0        | —                  |
| F2a-1     | [F2a-1] Project GitHub, labels et synchronisation                                                         | M0        | —                  |
| F2a-2     | [F2a-2] bascule vers main seule et ruleset                                                                | M0        | —                  |
| F2b-1     | [F2b-1] modèles d'issue et de PR                                                                          | M0        | —                  |
| F2b-2a    | [F2b-2a] issues de rattrapage des lots L0 à L20                                                           | M0        | —                  |
| épique    | [Processus] Fondations du chantier (étapes déjà livrées)                                                  | M0        | —                  |
| F2b-2b    | [F2b-2b] issues du chantier en cours et à venir                                                           | M0        | —                  |
| F2a-3     | [F2a-3] previews Cloudflare par PR et jeton pour release-please                                           | M0        | F2b-2b             |
| 1bis-d    | [1bis-d] matrice « qui vérifie quoi »                                                                     | M0        | —                  |
| épique    | [Processus] Fondations : étapes restantes                                                                 | M0        | —                  |
| Étape 2   | [Étape 2] ADR Architecture et politique Rust                                                              | M1        | F2a-3              |
| Étape 3   | [Étape 3] guards : architecture                                                                           | M1        | Étape 2            |
| Étape 4   | [Étape 4] @paulperigault/create en TypeScript strict                                                      | M1        | Étape 3            |
| Étape 5   | [Étape 5] mcp et générateur de tokens en TypeScript strict                                                | M1        | Étape 4            |
| Étape 6   | [Étape 6] tools/agents et tsc vers dist/ pour chaque paquet publié                                        | M1        | Étape 5            |
| épique    | [TypeScript strict] Migration des paquets et outils                                                       | M1        | —                  |
| Étape 7a  | [Étape 7a] crate pp-color : OKLCH, sRGB, gamut                                                            | M4        | Étape 2            |
| Étape 7b  | [Étape 7b] pp-color : contraste WCAG 2 et parité avec tokens                                              | M4        | Étape 7a           |
| Étape 8   | [Étape 8] paquet @paulperigault/color en WebAssembly                                                      | M4        | Étape 7b           |
| Étape 9   | [Étape 9] mesure du pipeline d'images                                                                     | M4        | Étape 6            |
| épique    | [Rust] Crate pp-color et paquet WebAssembly                                                               | M4        | —                  |
| V1        | [V1] ADR visualisation de données                                                                         | M-analyse | —                  |
| V2-0      | [V2-0] paquet @paulperigault/dataviz : contrat de données et palettes                                     | M-analyse | V1                 |
| Tokens    | [Tokens] variables d'entrée --pp-accent-hue et --pp-font-stack : branchement dans le build et dans create | M-analyse | V2-0               |
| V2a       | [V2a] graphiques SVG statiques : courbe et barres                                                         | M-analyse | V2-0               |
| V2b       | [V2b] graphiques SVG statiques : aire et jauge                                                            | M-analyse | V2a                |
| V3a       | [V3a] KPI et sparklines                                                                                   | M-analyse | V2a                |
| V3b       | [V3b] tableaux, légendes et filtres                                                                       | M-analyse | V3a                |
| V4a       | [V4a] crate pp-data : agrégation, quantiles, sous-échantillonnage                                         | M-analyse | V1, Étape 7b       |
| V4b       | [V4b] pp-data en WebAssembly : paquet, parité, budget de poids                                            | M-analyse | V4a                |
| V5        | [V5] page de démonstration d'un tableau de bord BI                                                        | M-analyse | V2b, V3b, V4b      |
| épique    | [Analyse] Visualisation de données BI                                                                     | M-analyse | —                  |
| Étape 10  | [Étape 10] Green IT : budgets de poids, carbone, page Sobriété                                            | M5        | Étape 6            |
| Étape 11  | [Étape 11] Dependabot pour Cargo, documentation, bilan                                                    | M5        | Étape 10, Étape 7b |
| épique    | [1.0] Sobriété, dépendances Cargo et bilan                                                                | M5        | —                  |
| Paul      | [Paul] étendre les jetons GitHub IaC au dépôt design-system                                               | M0        | —                  |
| Paul      | [Paul] apply OpenTofu, brique par brique                                                                  | M0        | Paul               |
| Paul      | [Paul] déclarer le site à Search Console et Bing Webmaster                                                | M2        | —                  |
| Paul      | [Paul] trusted publisher npm sur les cinq paquets                                                         | M2        | Paul, Étape 6      |
| Paul      | [Paul] fusionner les PR de release-please vers main                                                       | M2        | Paul               |
| Paul      | [Paul] tests de lecteurs d'écran : NVDA et VoiceOver                                                      | M5        | —                  |
| Paul      | [Paul] installer la PWA sur un appareil réel                                                              | M5        | —                  |
| Paul      | [Paul] relire les textes « à relire par Paul »                                                            | M5        | —                  |
| Paul      | [Paul] choisir la licence des contenus                                                                    | M2        | —                  |
| épique    | [Paul] Tâches manuelles du propriétaire                                                                   | M0        | —                  |

Choix à valider par Paul :

- **1bis-c** : ni le run-report ni la proposition ne la définissent ; aucune issue créée. 1bis-d est
  définie (matrice « qui vérifie quoi »).
- **Étapes 10 et 11** : la proposition ne les place pas dans un milestone ; M5 retenu, pas M2.
- **Étape 9** (mesure du pipeline d'images) : placée dans M4, sur consigne de Paul.
- **L9 (#51)** : reliée au milestone M3 et bloquée par le trusted publisher npm et l'étape 6.
- **Search Console et Bing Webmaster** : absents de `docs/manual-steps.md` ; issue reprise de la demande.
- **Réglage Actions « autoriser la création de PR »** : déjà actif (`can_approve_pull_request_reviews`
  vaut `true`), pas d'issue.
- **Hébergeur et déclaration d'accessibilité** (`docs/manual-steps.md` §6, points 2 et 4) : hors de la
  liste des tâches manuelles demandée ; pas d'issue.
- **Options de champ à ajouter au Project** : `Lot` = R (Rust), V (visualisation), S (sobriété).
  Les labels `pkg:color` et `pkg:data` n'existent pas ; `pkg:tokens` et `pkg:astro` en tiennent lieu.

Avancement (2026-10-29) : V2a (#94) faite (V2a-1 à V2a-4, D-040 à D-043) ; V2b (#95) faite (V2b-1, V2b-2, D-044, D-045). Suivantes, prêtes : V3a (#96, KPI et sparklines), puis V3b (#97) ; #121 en parallèle.
