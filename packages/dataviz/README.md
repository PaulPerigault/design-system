# @paulperigault/dataviz

Contrat de données, formatage français et palettes de graphiques accessibles, dérivées de la
couleur d'accent. TypeScript pur : aucun rendu, aucune dépendance d'exécution hors
`@paulperigault/tokens`. Les composants Astro qui l'utilisent viennent avec V2a.

Statut : en construction (0.0.0). Décisions : [ADR-0007](../../docs/adr/0007-visualisation-de-donnees.md).

## Usage

```ts
import tokens from '@paulperigault/tokens/tokens.json' with { type: 'json' };
import {
  createFormatter,
  derivePalettes,
  parseDataset,
  themeBaseFromTokens,
} from '@paulperigault/dataviz';

const dataset = parseDataset(json); // { ok: true, value } ou { ok: false, error: { code, message, path } }
const fr = createFormatter(); // locale « fr » ; fr.value.number(1234.5, '€') → « 1 234,5 € »

const base = themeBaseFromTokens(tokens, 'light');
if (base.ok) {
  const palettes = derivePalettes(270.7, 'light', base.value);
  // palettes.value.categorical : 6 couleurs OKLCH, l'accent en tête
}
```

Aucune fonction publique ne lève d'exception : toute erreur est un `Result` typé (`errors.ts`).

## Géométrie pure (V2a-1)

- `linearScale`, `verticalScale` (axe Y SVG inversé), `bandScale`, `timeDomain`, `timeScale` : domaine vers étendue.
- `niceTicks` (pas 1, 2, 5 × 10^n, domaine élargi) et `timeTicks` (jour, semaine, mois, année, alignés UTC).
- `lttb(xs, values, cible)` : indices retenus ; premier et dernier points gardés, `null` jamais inventés.
- `linePath` (`d` interrompu aux `null`, points isolés signalés) et `barRects` / `rectsPath` (barres groupées).
- Toutes renvoient un `Result` typé (`scale.*`, `geometry.bad-input`, `downsample.bad-target`).

## Aires et jauges (V2b-1)

- `areaPath(points, base)` : aire sous la courbe jusqu'à la base, un sous-chemin fermé par segment, rompue aux `null`.
- `stackSeries(colonnes)` : couches empilées (`lower`, `upper`). **Valeur manquante** : elle compte pour zéro dans le
  cumul, donc les couches du dessus reposent sur celles du dessous, mais sa propre couche est rompue (`null`) :
  le vide se voit et n'est jamais dessiné comme un zéro. Valeur négative : `stack.negative-value`.
- `sectorPath`, `radialLine`, `polar` : secteur d'anneau et aiguille (0° en haut, sens horaire) ; un tour entier devient un anneau.
- `gaugeReading` : valeur bornée à l'intervalle avec `clamped` (`below` ou `above`), `gauge.bad-range` si l'intervalle est nul ou inversé.
- `gaugeZones` et `zoneIndex` : n seuils strictement croissants donnent n + 1 zones ; `gauge.bad-thresholds` sinon.

## Changer l'accent en une variable

`--pp-accent-hue` : un nombre, la teinte OKLCH en degrés (`270.7` par défaut). Elle ne règle que la
teinte : la clarté et le chroma restent ceux du système (clair `oklch(47% 0.19 h)`, sombre
`oklch(78% 0.1 h)`), pour garder les contrastes AA. La typographie se règle par `--pp-font-stack`
(pile du texte, dont dérive `--pp-font-family-sans` ; `--pp-font-family-mono` reste à part).
Sorties inchangées : `--pp-color-accent`, `--pp-chart-*`, `--pp-font-family-*`. Ces deux variables
sont nommées ici ; leur branchement dans le build de `tokens` et dans `create` est une étape à part.

## Ce que garantit la dérivation

Pour chaque thème et chaque teinte, `derivePalettes` refuse (erreur typée) toute palette qui rate :

- catégorielle de 6 couleurs : ΔE00 ≥ 10 entre toute paire, en vision normale et après simulation
  de la protanopie, de la deutéranopie et de la tritanopie (Machado, Oliveira et Fernandes, 2009) ;
- séquentielle et divergente de 7 pas : ΔE00 ≥ 3 entre pas voisins ;
- tracés ≥ 3:1 contre le fond (WCAG 1.4.11) et texte sur l'accent ≥ 4,5:1 (1.4.3).

Un accent hors gamut sRGB à la clarté du système (par exemple teinte 30) voit son chroma réduit.
La dérivation est un échantillonnage du point le plus éloigné (farthest-point sampling) : l'accent
d'abord, puis la candidate la plus distincte des couleurs déjà prises.

## Structure

`src/domain` (contrat, dates ISO, couleur, palettes, échelles, LTTB, géométrie : pur, sans E/S), `src/application` (ports),
`src/infrastructure` (validation à la frontière, `Intl`, lecture de `tokens.json`), `src/errors.ts`.
