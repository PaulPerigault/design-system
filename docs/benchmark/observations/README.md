# Observations

- `sites.json` : le panel (32 acteurs, une page publique chacun).
- `observations.json` : mesures brutes du 2026-10-21 (`tools/benchmark/observe.mjs`).
- Résumé lisible : `node tools/benchmark/summarize.mjs docs/benchmark/observations/observations.json`.

Méthode, règles (robots.txt, aucune connexion, arrêt sur page protégée) et limites :
[../README.md](../README.md). Une première passe a été jetée : les bannières de consentement
fixées en bas d'écran étaient comptées comme barres de navigation et leur texte comme corps de
page ; la seconde passe les exclut (dialogues et blocs dont le texte parle de cookies ou de
consentement).
