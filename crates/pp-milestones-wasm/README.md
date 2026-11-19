# pp-milestones-wasm

Couche WebGL2 de la scène de jalons : contexte, shaders, tampons, appels de dessin. Elle ne décide
rien : tout ce qui se calcule est dans [`pp-milestones`](../pp-milestones/README.md). Pas de `wgpu`,
`three-d` ni `bevy`. Décision : ADR-0012, chantier #360, brique #361.

Dépendances : `pp-milestones`, `wasm-bindgen` (version exacte, comme les autres crates) et `web-sys`
avec une feature par type utilisé (`HtmlCanvasElement`, `WebGl2RenderingContext`, `WebGlBuffer`,
`WebGlProgram`, `WebGlShader`, `WebGlUniformLocation`, `WebGlVertexArrayObject`,
`WebGlContextAttributes`, `WebGlPowerPreference`, `WebglLoseContext`).

## Modules

| Module     | Rôle                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------- |
| `gl`       | contexte WebGL2 transparent (profondeur, anticrénelage, basse consommation), `loseContext`   |
| `shaders`  | compilation et liaison ; sources GLSL ES 3.00 dans `src/shaders/*.glsl`                      |
| `draw`     | tampons envoyés une fois en octets (`to_le_bytes`, sans `unsafe`), uniformes, `drawElements` |
| `bindings` | `Scene` (constructeur, `frame`, perte et restauration, `destroy`)                            |
| `controls` | taille, thème, jalon actif, pointeur, gyroscope, sélection                                   |
| `input`    | validation des tableaux et du thème (`checkInput`), sans toucher au canvas                   |
| `fault`    | codes d'erreur littéraux (ceux de `SceneError` et ceux de WebGL)                             |

Un contexte par instance. `Scene.contextLost()` abandonne les ressources (elles n'existent plus),
`Scene.contextRestored()` les recrée ; `Scene.destroy()` libère tampons, VAO et programme puis rend
le contexte au navigateur. L'enveloppe TypeScript pose les écouteurs (`webglcontextlost` avec
`preventDefault()`, `webglcontextrestored`) et pilote `requestAnimationFrame` : `Scene.frame(now)`
dessine une image et rend vrai tant qu'une transition ou une inclinaison est en cours.

## Construction

```
node tools/wasm/build-milestones.ts [--out <dossier>]
```

`cargo build -p pp-milestones-wasm --target wasm32-unknown-unknown --release --locked`, puis
`wasm-bindgen` 0.2.130 (`--target web`), puis `wasm-opt -Oz` fourni par le paquet npm `binaryen`
(version exacte `132.0.0`, devDependency racine, installé par `npm ci`). `wasm-opt` est un script
Node : aucun outil global, aucun binaire natif, rien à installer sous Windows. Le script échoue
clairement si `binaryen` manque. Sortie par défaut : `packages/milestones-3d/wasm/` (ignoré par git).
`wasm-pack` n'est pas utilisé.

`strip = true` retire la section `target_features` : le script passe donc à `wasm-opt` la liste des
fonctionnalités de la cible (`bulk-memory`, `multivalue`, `mutable-globals`,
`nontrapping-float-to-int`, `reference-types`, `sign-ext`), sans quoi il rejette les modules qui en
emploient une.

## Profil de compilation

Le profil racine reste `opt-level = "s"`. Les deux crates de la scène portent leur propre entrée
`[profile.release.package.*]`, pour que leur poids ne dépende pas du profil racine.
`lto = true`, `codegen-units = 1`, `panic = "abort"` et `strip = true` ne se règlent pas par paquet :
ce sont ceux du profil racine, déjà conformes à l'ADR, et ils s'appliquent au binaire final.

Comparaison de `"s"` et `"z"` (2026-11-19, Rust 1.99.1, binaryen 132) :

| `opt-level` | avant wasm-opt (brut / brotli) | après wasm-opt -Oz (brut / gzip / brotli) |
| ----------- | ------------------------------ | ----------------------------------------- |
| `"s"`       | 148 755 o / 36 264 o           | 70 857 o / 32 976 o / **28 076 o**        |
| `"z"`       | 161 156 o / 37 665 o           | 70 732 o / 33 148 o / 28 435 o            |

Après `wasm-opt`, `"s"` est plus petit en brotli (le poids livré) de 359 octets, `"z"` en brut de
125 octets. La règle de l'ADR est que la plus petite mesure l'emporte : `"s"`, valeur écrite en
clair dans `Cargo.toml`. À refaire après un changement important du code.

## Poids mesuré (jamais bloquant)

Cible de l'ADR : 60 Kio en brotli pour le `.wasm`.

| Fichier                            | brut (o) | gzip (o) | brotli (o) |
| ---------------------------------- | -------: | -------: | ---------: |
| `.wasm` avant wasm-opt             |  148 755 |   44 484 |     36 264 |
| `.wasm` après wasm-opt -Oz (livré) |   70 857 |   32 976 |     28 076 |
| glue JavaScript (`wasm-bindgen`)   |   23 810 |    5 511 |      4 887 |

Poids livré : 27,4 Kio en brotli pour le `.wasm`, 32,2 Kio avec la glue. `wasm-opt` retire 52 %
du poids brut. Essais sans effet notable (moins de 0,3 %) : `--converge`, `--strip-producers`,
`--strip-debug`, `--zero-filled-memory`. La CI écrit ce tableau dans son résumé (job `wasm`).

`.wasm` existants, mesurés avant et après ce changement (même chaîne, mêmes octets) :

| Fichier                 | brut (o) | brotli (o) | SHA-256                                                            |
| ----------------------- | -------: | ---------: | ------------------------------------------------------------------ |
| `pp_color_wasm_bg.wasm` |   54 205 |     20 010 | `b62bcf7349ae12c4fb0647e84ca636cf01352f9a9d48f6ef0ec91757d39c36c3` |
| `pp_data_wasm_bg.wasm`  |   58 498 |     21 612 | `c482752316459397836e9080ae5f056f6884cf61825acf7eeccd79c3f0264196` |

Les deux sont reconstruits après un `cargo clean` de leurs crates, avec `wasm-bindgen` seul (sans
`wasm-opt`, comme leurs scripts) : octets identiques.

## Vérification dans les navigateurs

Fumée hors dépôt (Playwright, scène de cinq jalons, rendu logiciel) : le `.wasm` se charge, la scène
se dessine, la glissade s'arrête au jalon actif, la sélection rend le bon identifiant et les entrées
invalides rendent leur code, sur les Chromium, Firefox et WebKit de Playwright. L'audit complet (perte de
contexte, Lighthouse, axe) est la brique #366.
