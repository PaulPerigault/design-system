# @paulperigault/tokens

Design tokens DTCG 2025.10 de paulperigault.fr : CSS, JSON et types générés ; couleur et contraste.

Publié sur npmjs. Série `0.x` : l'API peut changer d'une version à l'autre, lire le
[CHANGELOG](https://github.com/PaulPerigault/design-system/blob/main/packages/tokens/CHANGELOG.md)
avant une mise à jour. Aucune dépendance d'exécution.

## Installation

```bash
npm install @paulperigault/tokens
```

Node 24 ou plus récent.

## Exemple

En CSS, les tokens sont des propriétés `--pp-*` posées sur `:root` :

```css
@import '@paulperigault/tokens/tokens.css';

.note {
  color: var(--pp-color-fg);
  background-color: var(--pp-color-surface);
  padding: var(--pp-space-m);
}
```

Les couleurs utilisent `light-dark()` et suivent `prefers-color-scheme` ; `data-theme="light"` ou
`data-theme="dark"` sur `<html>` force l'un des deux thèmes.

En TypeScript, le contraste WCAG 2 accepte un hexadécimal ou un texte `oklch(…)` :

```ts
import { contrastRatio } from '@paulperigault/tokens/contrast';

contrastRatio('#171921', '#ffffff'); // 17,54…
contrastRatio('oklch(47% 0.19 270.7)', '#ffffff'); // 7,24… (accent clair)
```

## Sous-chemins

| Import                              | Contenu                                                          |
| ----------------------------------- | ---------------------------------------------------------------- |
| `@paulperigault/tokens/tokens.css`  | propriétés `--pp-*`, thèmes clair et sombre                      |
| `@paulperigault/tokens/tokens.json` | les mêmes valeurs en JSON                                        |
| `@paulperigault/tokens/types`       | type `TokenName` (union des noms `--pp-*`)                       |
| `@paulperigault/tokens/color`       | OKLCH vers sRGB, gamut, `parseOklch`, `formatOklch`              |
| `@paulperigault/tokens/contrast`    | `contrastRatio` (WCAG 2), `apcaLc`, `relativeLuminance`          |
| `@paulperigault/tokens/palette`     | dérivation des palettes de graphiques (réexportée par `dataviz`) |
| `@paulperigault/tokens/customize`   | `parseBuildInput`, `deriveOverrides` (voir la section suivante)  |

## Entrées du build : teinte d'accent et pile de police

Contrat d'un projet externe (ADR-0006 décision 3, ADR-0007 décision 4). La ligne de commande
ci-dessous se lance depuis `packages/tokens` dans le dépôt (`scripts/` n'est pas publié) ; un site
généré par `@paulperigault/create` passe les mêmes entrées par `--accent-hue` et `--font-stack`.

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
- dérivation : `build.contrast-failed` (texte sur accent) et `build.role-contrast-failed` (focus
  et statut « en cours » sous leur seuil), teinte, thème et rapport mesuré dans le message ;
  `build.derivation-failed` ;
- pile : `build.stack-empty`, `build.stack-too-long`, `build.stack-unsafe` (`;`, accolades,
  `url(`, `@import`, retours à la ligne, commentaires, guillemets ou parenthèses non appariés) ;
- ligne de commande : `build.bad-usage`.

Limites : les rampes `--pp-chart-seq-*` et `--pp-chart-div-*` sont dérivées mais pas émises (le
défaut ne les porte pas). Décisions : D-056, D-057.

## Provenance

Chaque version est publiée par le workflow `release` du dépôt, avec une attestation de
provenance npm. Dans un projet qui installe ce paquet, `npm audit signatures` vérifie les
signatures du registre et les attestations. Détails :
[publication npm](https://github.com/PaulPerigault/design-system/blob/main/docs/process/publication.md).

## Licence et liens

- Licence MIT : [LICENSE](https://github.com/PaulPerigault/design-system/blob/main/packages/tokens/LICENSE)
- Documentation : <https://design.paulperigault.dev>
- Source : <https://github.com/PaulPerigault/design-system/tree/main/packages/tokens>
- Versions : [CHANGELOG.md](https://github.com/PaulPerigault/design-system/blob/main/packages/tokens/CHANGELOG.md)
