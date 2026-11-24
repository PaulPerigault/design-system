# pp-milestones

Logique de la scène 3D de jalons, en Rust pur. Aucune dépendance à `wasm-bindgen` ni à `web-sys` :
tout ce qui se calcule se teste avec `cargo test`, sans navigateur. La couche WebGL2 est dans
[`pp-milestones-wasm`](../pp-milestones-wasm/README.md). Décisions : ADR-0012 et ADR-0013, chantiers #360 et #389.

Dépendances : `glam` (f32 seulement, sans les types entiers ni f64) et `pp-color` (chemin du dépôt)
pour la conversion OKLCH vers sRGB.

## Modules

| Module        | Rôle                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| `data`        | `MilestonesData` : 1 à 24 jalons (`id`, `status`, `has_badge`), objectif `@goal` facultatif |
| `kinds`       | `Status` (`achieved`, `planned`)                                                            |
| `columns`     | construction depuis des tableaux parallèles (ids, statuts, indicateurs de badge)            |
| `spline`      | segment de Catmull-Rom uniforme (point et dérivée)                                          |
| `layout`      | chemin (`path_point`, `path_tangent`), rail, repère local d'une médaille                    |
| `progress`    | `progress_of`, `nearest`, `abscissa` : correspondance entre `p` de [0, 1] et les étapes     |
| `camera`      | caméra sur la spline, gros plan sur un jalon, cadrage selon l'aspect, projection            |
| `geometry`    | support, fantôme filaire, anneau, étoile, rail, repères ; `Pack`                            |
| `plan`        | liste de dessin d'une image (`DrawItem`), `medals` pour les médailles et l'objectif         |
| `frame`       | `SceneState::frame` : horloge, cible de la caméra, inclinaison, liste de dessin             |
| `state`       | `SceneState` : tout l'état d'une scène, horloge injectée                                    |
| `controls`    | progression, étape active ou survolée, pointeur, gyroscope, sélection                       |
| `picking`     | disque d'une étape à l'écran (sélection et étiquettes)                                      |
| `project`     | position écran, échelle et visibilité de chaque étape                                       |
| `easing`      | `CubicBezier` (même définition que `cubic-bezier()` en CSS)                                 |
| `animation`   | `Tween` : durée et courbe du thème, temps injecté                                           |
| `tilt`        | inclinaison lissée au pointeur ou au gyroscope                                              |
| `interaction` | étape active et survolée                                                                    |
| `theme`       | sept couleurs, deux durées, une courbe, validés et convertis en sRGB                        |

Erreurs : `SceneError`, une énumération, un code littéral par variante (`SceneError::code`).
`#![forbid(unsafe_code)]`, ni `unwrap`, `expect`, `panic!` ni indexation non vérifiée hors tests.
Les emblèmes géométriques de l'ADR-0012 n'existent plus (ADR-0013).

## Valeurs par défaut tranchées

Chacune se change dans une constante nommée.

- **Données** : le crate ne voit que `id`, `status`, `has_badge` et la présence d'un objectif.
  L'ordre est celui fourni (le tri par date est fait côté Astro). Un jalon `planned` ne montre jamais
  de badge, quel que soit `has_badge`.
- **Étapes** : les jalons (indices 0 à `n - 1`), puis l'objectif (indice `n`, identifiant réservé
  `@goal`, invalide pour un jalon). La progression `p` va de 0 (première étape) à 1 (dernière).
- **Chemin** : spline de Catmull-Rom **uniforme**, points de contrôle analytiques (`layout::knot`) à
  pas constant : le centripète n'apporte rien à pas constant et coûte des racines dans le `.wasm`.
  Abscisse ordinale `i` par jalon, `n` pour l'objectif ; lacet 1,5 (`SWAY`), dénivelé 0,4 par jalon
  (`RISE`), espacement 5. L'abscisse approche l'abscisse curviligne (vitesse entre 5,0 et 5,4,
  vérifiée par `proptest`) : pas de table de longueurs.
- **Caméra** : vue d'ensemble à 3,9 du point, élevée de 0,6 rad, regard 1,4 en avant ; gros plan sur
  un jalon (palier de 0,08, retour à la vue d'ensemble à 0,35) : l'œil vient face à la médaille
  (relevée de 0,2 rad) à la distance où son rayon occupe 74 % de la plus petite demi-étendue du
  cadre (`camera::close_distance`) ; en portrait 390x844 le champ s'élargit (50° horizontal au
  moins) et la médaille et son anneau restent entiers (testé pour quatre formats).
- **Lissage** : un `Tween` vers la cible, durée `--pp-duration-base` et courbe du thème ; durée nulle
  (mouvement réduit) : saut. `set_progress` n'agit qu'à l'image suivante, avec l'horloge de
  l'appelant : une scène restée au repos glisse quand même.
- **Médaille** : support à 32 segments, biseau 0,09, pas de face de badge (image HTML, ADR-0014). Objectif : étoile à cinq branches extrudée
  (0,3) avec son contour. Fantôme : même silhouette en fil de fer. Anneau : à 0,06 du bord.
- **Éclairage** : Lambert (une lumière, ambiante 0,6) sur le support et l'étoile.
  Le rail, les repères et les fantômes s'estompent vers le transparent de 9 à 42 unités ; les
  médailles ne s'estompent pas et ne sont tracées que de 2
  abscisses derrière à 5 devant la caméra.
- **Inclinaison** : 0,35 rad au plus, lissée avec `--pp-duration-fast`, sur la médaille survolée,
  sinon la plus proche de la caméra. Le survol n'avance ni n'agrandit la médaille : le badge HTML reste
  centré sur la position projetée.
- **Courbe non reconnue** : `CubicBezier::LINEAR`, jamais une courbe inventée.

## Thème : forme du tableau

`Theme::from_slice` reçoit `THEME_LEN` = 34 nombres (le paquet TypeScript les produit) :

1. sept couleurs de 4 nombres, dans l'ordre de `Slot` : `bg`, `fg`, `accent`, `on-accent`, `line`,
   `muted`, `paper` ; chacune : espace (0 sRGB, 1 OKLCH) puis trois composantes ;
2. `duration-base` et `duration-fast`, en millisecondes (0 à 10 000) ;
3. les quatre points de contrôle de la courbe.

`paper` est le jeton `--pp-color-bg` résolu en mode **clair**, quelle que soit la préférence
(`color-scheme: light` pour la sonde) : support de la médaille, clair fixe (conditions des badges
AWS, ADR-0013). `bg` suit le thème courant ; la scène ne s'en sert plus (plus de brouillard opaque).

L'analyse du texte CSS est faite côté TypeScript. Ce crate valide et convertit : l'OKLCH passe par
`pp-color` (`fit_to_gamut` puis `oklch_to_srgb`), parité vérifiée à 1e-6.

## Vérification

```
cargo fmt --all --check
cargo clippy --workspace --all-targets --locked -- -D warnings -W clippy::pedantic
cargo test --workspace --locked
```

Tests : contrat de données, easing, spline (continuité, bornes, vitesse, C1 par `proptest`), progression
et étape la plus proche, caméra (gros plan exact sur un jalon, cadrage en quatre formats, jalon
précédent derrière l'œil), lissage monotone et saut à durée nulle, géométrie (indices dans les
bornes, UV dans [0, 1], normales unitaires), liste de
dessin, projection, thème (parité avec `pp-color`).
