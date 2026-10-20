# Matrice des tests

Une ligne par brique : où sont ses tests unitaires et ses tests de bout en bout. Fichier tenu par
l'orchestrateur seul (fragments des tâches fusionnés à l'intégration).

| Brique                                    | Tests unitaires                               | E2E                          | Remarque |
| ----------------------------------------- | --------------------------------------------- | ---------------------------- | -------- |
| Garde commitlint (signature d'outil)      | `tools/commitlint/no-tool-signature.test.mjs` | n/a                          | outil    |
| Contrôles (taille, lockfile, publication) | `tools/checks/*.test.mjs`                     | n/a                          | outil    |
| Garde-fous Claude Code                    | `tools/guards/*.test.mjs`                     | n/a                          | outil    |
| Dispatcher                                | `tools/agents/lib/*.test.mjs`                 | pilote L1 (exécution réelle) | outil    |
| Publication                               | `tools/release/publish-new.test.mjs`          | workflow `release`           | outil    |
