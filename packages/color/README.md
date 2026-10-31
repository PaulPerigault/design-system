# @paulperigault/color

`pp-color` (OKLCH, sRGB, gamut, contraste WCAG 2 et APCA) compilé en WebAssembly, avec une
enveloppe TypeScript. Zéro dépendance d'exécution. Statut : en construction (0.0.0, non publié).

Le TypeScript de `@paulperigault/tokens` reste la référence : ce paquet ne remplace aucun de ses
appels tant que la parité n'est pas établie en CI. Décisions : ADR-0006 (décision 4), D-091 à D-094.

## Usage

```ts
import { contrastRatio, hexToOklch, init, toHex } from '@paulperigault/color';

await init(); // charge et instancie le .wasm, une seule fois ; sans lui : ColorError « not-ready »
hexToOklch('#336699'); // { l, c, h }
contrastRatio('#171921', { l: 0.985, c: 0.004, h: 270.7 }); // 16,79
toHex({ l: 0.5, c: 0.4, h: 150 }); // ColorError { code: 'out-of-gamut' }
```

Mêmes noms et signatures que la référence : `oklchToLinearSrgb`, `oklchToSrgb`, `linearToGamma`,
`gammaToLinear`, `inSrgbGamut`, `fitToGamut`, `toHex`, `hexToOklch`, `relativeLuminance`,
`contrastRatio`, `apcaLc`. En plus : `srgbToOklch`, `init`, `isReady`, `ColorError`.

## Écarts de contrat

Une erreur est une `ColorError` avec un `code` littéral (`non-finite`, `out-of-range`,
`invalid-hex`, `out-of-gamut`, `invalid-length`, `not-ready`, `load-failed`, `internal`) et, si elle
s'applique, une `component` (`lightness`, `chroma`, `hue`, `red`, `green`, `blue`, `epsilon`).
Le `.wasm` ne panique jamais : `pp-color` rend toujours un `Result`.

| Cas                                       | Référence TypeScript                    | Ce paquet                             |
| ----------------------------------------- | --------------------------------------- | ------------------------------------- |
| canal sRGB fini hors de [0, 1], luminance | nombre fini (prolongement par symétrie) | `out-of-range` (`red`, `green`…)      |
| valeur `NaN` ou infinie                   | `NaN` ou résultat sans sens             | `non-finite`                          |
| clarté hors [0, 1], chroma négatif        | pas de contrôle (sauf `parseOklch`)     | `out-of-range`                        |
| couleur hors gamut, `toHex` ou contraste  | `RangeError`                            | `out-of-gamut`                        |
| texte qui n'est pas `#rrggbb`             | `TypeError`                             | `invalid-hex`                         |
| texte `oklch(…)` passé à un contraste     | analysé par `parseOklch`                | `invalid-hex` (analyse hors du .wasm) |

Mesure du 2026-10-30 : `relativeLuminance({ r: -0.1, g: 0.5, b: 0.5 })` rend 0,166 côté TypeScript.
Seule une entrée `NaN` y donne `NaN`.

## Construction

Le `.wasm` n'est jamais commité : la CI le produit (`npm run build:wasm`, job `wasm`), avec
`cargo`, la cible `wasm32-unknown-unknown` et `wasm-bindgen` 0.2.130. `npm run check:wasm`
vérifie l'empreinte SHA-256 enregistrée dans `wasm/pp_color_wasm_bg.wasm.sha256` (format
`sha256sum`), publiée avec le paquet. `npm run measure` affiche le temps de chargement.

`init()` lit le fichier de façon synchrone sous Node et par `fetch` ailleurs, à l'adresse
`../wasm/pp_color_wasm_bg.wasm` relative au module. Le glue est chargé par une URL calculée :
un bundleur doit copier le dossier `wasm/` (ou ne pas le traiter).

Sous CSP, le navigateur n'exige que `'wasm-unsafe-eval'` dans `script-src` et `'self'` dans
`connect-src`, déjà dans la politique de la documentation.
