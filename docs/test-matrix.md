# Matrice des tests

Une ligne par brique : où sont ses tests unitaires et ses tests de bout en bout. Fichier tenu par
l'orchestrateur seul (fragments des tâches fusionnés à l'intégration).

| Brique                                    | Tests unitaires                                                                          | E2E                                                                       | Remarque           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| Garde commitlint (signature d'outil)      | `tools/commitlint/no-tool-signature.test.mjs`                                            | n/a                                                                       | outil              |
| Contrôles (taille, lockfile, publication) | `tools/checks/*.test.mjs`                                                                | n/a                                                                       | outil              |
| Garde-fous Claude Code                    | `tools/guards/*.test.mjs`                                                                | n/a                                                                       | outil              |
| Dispatcher                                | `tools/agents/lib/*.test.mjs`                                                            | pilote L1 (exécution réelle)                                              | outil              |
| Publication                               | `tools/release/publish-new.test.mjs`                                                     | workflow `release`                                                        | outil              |
| Scène 3D de jalons                        | `packages/milestones-3d/test`, crates `cargo test`, `packages/astro/test/milestones-3d*` | `task audit:milestones-3d` (`tools/audit/`), job CI `milestones-3d-audit` | audit à la demande |

## Audit web de la scène 3D (`task audit:milestones-3d`)

Contrôles, sur Chromium, Firefox et WebKit : rendu (capture non vide, cadrage, fidélité aux jetons,
fil de fer lisible, clair et sombre, bureau et mobile), robustesse (perte de contexte puis
restauration, sans WebGL2, mouvement réduit, `saveData`, appareil faible, fuites après `destroy()`),
accessibilité (axe avec et sans 3D à 360 et 1440 px, clavier, focus visible, contraste du panneau),
console et réseau (zéro erreur, `.wasm` en `application/wasm`, brotli, cache long, aucune requête
tierce) et performance (Lighthouse mobile avant et après, CLS, LCP, INP, tâches longues, images).

Prérequis : `npm ci`, `npx playwright install chromium firefox webkit`, Rust avec
`cargo install --locked wasm-bindgen-cli@0.2.130` pour construire le `.wasm` (il n'est jamais commité),
et `task` ([installation](https://taskfile.dev/installation) : `winget install Task.Task`,
`brew install go-task`). Options après `--` : `--engines chromium,firefox`, `--skip-build`,
`--skip-lighthouse`, `--url <aperçu>`. Lighthouse 13.6.0 est lancé par `npx` (version épinglée, pas
une dépendance du dépôt). Un moteur absent est une ligne en échec, pas un saut silencieux. La CI lance
le même script (job `milestones-3d-audit`) seulement sur les PR qui touchent la scène.
