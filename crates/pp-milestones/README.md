# pp-milestones

Logique de la scène 3D de jalons, en Rust pur. Aucune dépendance à `wasm-bindgen` ni à `web-sys` :
tout ce qui se calcule se teste avec `cargo test`, sans navigateur. La couche WebGL2 est dans
[`pp-milestones-wasm`](../pp-milestones-wasm/README.md). Décision : ADR-0012, chantier #360, brique #361.

Dépendances : `glam` (f32 seulement, sans les types entiers ni f64) et `pp-color` (chemin du dépôt)
pour la conversion OKLCH vers sRGB.

## Modules

| Module        | Rôle                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| `data`        | `MilestonesData` : 1 à 24 jalons, identifiants `[a-z0-9-]+` uniques, cible finale facultative |
| `kinds`       | `Status` (`achieved`, `planned`) et `Emblem` (9 clés fermées)                                 |
| `columns`     | construction depuis des tableaux parallèles, la forme qui traverse la frontière               |
| `geometry`    | maillages : médaille, fil de fer, 9 emblèmes en relief, ruban, cible ; `Pack` (un tampon)     |
| `layout`      | chemin du ruban, positions équidistantes                                                      |
| `camera`      | perspective, glissade le long du chemin, projection écran                                     |
| `easing`      | `CubicBezier` (même définition que `cubic-bezier()` en CSS)                                   |
| `animation`   | `Tween` : durée et courbe du thème, temps injecté                                             |
| `tilt`        | inclinaison lissée au pointeur ou au gyroscope                                                |
| `interaction` | jalon actif, navigation `Next`, `Previous`, `First`, `Last`                                   |
| `picking`     | sélection au pointeur par disques projetés                                                    |
| `theme`       | six couleurs, deux durées, une courbe, validés et convertis en sRGB                           |
| `plan`        | liste de dessin d'une image (parcourue par la couche GL, sans décision)                       |
| `state`       | `SceneState` : tout l'état d'une scène, horloge injectée                                      |

Erreurs : `SceneError`, une énumération, un code littéral par variante (`SceneError::code`).
`#![forbid(unsafe_code)]`, ni `unwrap`, `expect`, `panic!` ni indexation non vérifiée hors tests.

## Valeurs par défaut tranchées

Choix faits sans le propriétaire, comme l'ADR le demande. Chacun se change dans une constante nommée.

- **Données** : le crate ne voit que `id`, `status`, `emblem` et la présence d'une cible. Libellé,
  groupe, date et lien vivent dans le HTML ; le paquet TypeScript les valide.
- **Emblème absent** : `disc`. **Clé inconnue** : erreur `unknown-emblem`, jamais de repli muet.
- **Positions** : équidistantes (`layout::SPACING` = 5), sans échelle de temps.
- **Médaille** : cylindre à 32 segments (`geometry::solids::SEGMENTS`), biseau de 0,09, relief
  d'emblème de 0,07, emblème à 62 % du rayon.
- **Éclairage** : une lumière fixe et une ambiante (0,45), ombrage de Lambert multiplicatif. Les
  couleurs restent en sRGB gamma : le canvas affiche du sRGB et les éléments non éclairés (ruban,
  fil de fer) reprennent exactement la couleur du thème.
- **Brouillard** vers la couleur de fond, de 9 à 42 unités : les jalons lointains se fondent dans
  la page sans que le canvas ait un fond propre (il reste transparent).
- **Inclinaison** : 0,35 rad au plus (environ 20°), lissée avec la durée `--pp-duration-fast`.
- **Caméra** : 3,2 unités derrière le jalon regardé et 2,2 au-dessus, plus près que l'espacement
  pour que le jalon précédent reste derrière l'œil. Le champ vertical s'élargit sur un canvas plus
  haut que large, pour garder une médaille entière.
- **Courbe non reconnue** : `CubicBezier::LINEAR` (progression linéaire), jamais une courbe inventée.

## Thème : forme du tableau

`Theme::from_slice` reçoit `THEME_LEN` = 30 nombres (le paquet TypeScript les produit) :

1. six couleurs de 4 nombres (`bg`, `fg`, `accent`, `on-accent`, `line`, `muted`) : espace (0 sRGB,
   1 OKLCH) puis trois composantes ;
2. `duration-base` et `duration-fast`, en millisecondes (0 à 10 000) ;
3. les quatre points de contrôle de la courbe.

L'analyse du texte CSS (formats `rgb()`, `color()`, `oklch()` rendus par `getComputedStyle`) est faite
côté TypeScript, où se trouve le DOM. Ce crate valide et convertit : l'OKLCH passe par `pp-color`
(`fit_to_gamut` puis `oklch_to_srgb`), avec une parité vérifiée à 1e-6.

## Vérification

```
cargo fmt --all --check
cargo clippy --workspace --all-targets --locked -- -D warnings -W clippy::pedantic
cargo test --workspace --locked
```

Tests : contrat de données, easing (bornes, monotonie et extrémités par `proptest`, valeur de
référence de `ease`), interpolation, caméra, géométrie (indices dans les bornes, normales unitaires,
emblèmes dans la face), machine d'états, thème (parité avec `pp-color`), sélection.
