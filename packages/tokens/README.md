# @paulperigault/tokens

Design tokens DTCG 2025.10 de paulperigault.fr : CSS, JSON et types générés ; couleur et contraste.

Statut : en construction (0.0.0). Voir le [README du dépôt](../../README.md).

## Entrées du build : teinte d'accent et pile de police

Contrat d'un projet externe (ADR-0006 décision 3, ADR-0007 décision 4) :

| Entrée            | Valeur                                        | Sorties régénérées                                                                 |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `--pp-accent-hue` | degrés OKLCH, 0 à 360 (nombre ou texte)       | `--pp-color-accent`, `--pp-chart-1` à `6` (clair et sombre), `on-accent` reconduit |
| `--pp-font-stack` | liste de familles CSS, 256 caractères au plus | `--pp-font-family-sans` (`--pp-font-family-mono` ne change pas)                    |

Clarté et chroma de l'accent sont fixés par le système (clair `oklch(47% 0.19 h)`, sombre
`oklch(78% 0.1 h)`) ; les neutres d'Encre restent à la teinte 270,7. Sans entrée, la sortie est
identique octet pour octet à `generated/`.

```
node scripts/build.ts --accent-hue 145 --font-stack "'Inter Variable', system-ui, sans-serif" --out-dir ./theme
```

Une variante s'écrit toujours hors de `generated/` (`--out-dir` obligatoire, `--check` refusé).
En code : `parseBuildInput` et `deriveOverrides` (`@paulperigault/tokens/customize`) rendent un
`Result` ; jamais de `throw`. Erreurs (`error.code`) :

- teinte : `build.hue-missing`, `build.hue-not-finite`, `build.hue-out-of-range` ;
- dérivation : `build.contrast-failed` (teinte, thème et rapport mesuré dans le message),
  `build.derivation-failed` ;
- pile : `build.stack-empty`, `build.stack-too-long`, `build.stack-unsafe` (`;`, accolades,
  `url(`, `@import`, retours à la ligne, commentaires, guillemets ou parenthèses non appariés) ;
- ligne de commande : `build.bad-usage`.

Limites : les rampes `--pp-chart-seq-*` et `--pp-chart-div-*` sont dérivées mais pas émises (le
défaut ne les porte pas) ; `--pp-color-focus` et `--pp-color-status-running` gardent leur valeur
d'origine. Décision : D-056.
