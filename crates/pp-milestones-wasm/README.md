# pp-milestones-wasm

Couche WebGL2 de la scène de jalons : contexte, shaders, tampons, textures, appels de dessin. Elle ne
décide rien : tout ce qui se calcule est dans [`pp-milestones`](../pp-milestones/README.md). Pas de
`wgpu`, `three-d` ni `bevy`. Décisions : ADR-0012 et ADR-0013, chantiers #360 et #389.

Dépendances : `pp-milestones`, `wasm-bindgen` (version exacte) et `web-sys` avec une feature par type
utilisé (`HtmlCanvasElement`, `ImageBitmap`, `WebGl2RenderingContext`, `WebGlBuffer`, `WebGlProgram`,
`WebGlShader`, `WebGlTexture`, `WebGlUniformLocation`, `WebGlVertexArrayObject`,
`WebGlContextAttributes`, `WebGlPowerPreference`, `WebglLoseContext`).

## Modules

| Module     | Rôle                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| `gl`       | contexte WebGL2 transparent (profondeur, anticrénelage, basse consommation), `loseContext` |
| `shaders`  | compilation et liaison ; sommet partagé, fragment des surfaces, fragment du badge          |
| `gpu`      | programmes, tampons envoyés une fois en octets, VAO, textures                              |
| `draw`     | une passe sur la liste de dessin : surfaces, puis faces de badge                           |
| `texture`  | envoi d'un `ImageBitmap`, mipmaps, anisotropie, `setTexture`                               |
| `bindings` | `Scene` (constructeur, `frame`, perte et restauration, `destroy`)                          |
| `controls` | taille, thème, progression, actif, survol, pointeur, gyroscope, sélection, projection      |
| `input`    | validation des tableaux et du thème (`checkInput`), sans toucher au canvas                 |
| `fault`    | codes d'erreur littéraux (ceux de `SceneError` et ceux de WebGL)                           |

## API wasm-bindgen (contrat du lot suivant)

```
new Scene(canvas, ids: string[], statuses: string[], badges: Uint8Array, goal: boolean,
          theme: Float32Array, active: string)           // lève un code ; active "" : aucun
scene.frame(now: number): boolean                         // vrai : une autre image est due
scene.resize(width: number, height: number)               // pixels du canvas (u32)
scene.setTheme(theme: Float32Array)                       // THEME_LEN = 34 nombres
scene.setProgress(p: number)                              // [0, 1], lève "progress" si non fini
scene.progressOf(id: string): number                      // [0, 1], -1 si inconnu (jamais NaN)
scene.setActive(id: string): boolean                      // "" efface ; faux si inconnu
scene.setHover(id: string)                                // "" ou inconnu : aucun
scene.pointerMove(x: number, y: number)                   // [-1, 1], y vers le haut (inclinaison)
scene.pointerLeave()
scene.setGyro(x: number, y: number)                       // non fini : rend la main au pointeur
scene.pick(x: number, y: number): string                  // x, y en [-1, 1], y vers le haut ; "" si rien
scene.project(): Float32Array                             // 4 nombres par étape, voir ci-dessous
scene.setTexture(id: string, bitmap: ImageBitmap)         // lève "unknown-id" (inconnu ou objectif)
scene.contextLost(); scene.contextRestored(); scene.destroy()
checkInput(ids, statuses, badges, goal, theme)            // même contrôle que le constructeur
```

- **Étapes** : les jalons dans l'ordre fourni (le tri par date est côté Astro), puis l'objectif
  s'il y en a un, d'identifiant réservé `@goal` (accepté par `progressOf`, `setActive`, `setHover` ;
  `pick` le rend ; `setTexture` le refuse). `badges[i]` vaut 1 quand un badge est attendu pour le
  jalon `i` (0 sinon) ; `statuses[i]` vaut `achieved` ou `planned`.
- **`project()`** : pour chaque étape (jalons puis objectif) : `x`, `y` de 0 à 1 (origine en haut à
  gauche du canvas), rayon de la médaille rapporté à la hauteur du canvas (pixels CSS du rayon =
  valeur × hauteur CSS), `visible` 1 ou 0 (devant la caméra et centre dans le cadre). Valeurs de la
  DERNIÈRE image dessinée : appeler après `frame`. `pick` lit aussi la dernière image.
- **Progression** : `setProgress` n'agit qu'à la prochaine `frame`, avec l'horloge de `frame` : une
  scène au repos glisse quand même. Durée du thème nulle (mouvement réduit) : saut. Toute commande
  (progression, survol, actif, texture, thème, taille) demande une image : `frame` rend faux au
  repos, l'enveloppe en planifie une après chaque commande.
- **Codes** : nouveaux `unknown-id` et `progress` ; `unknown-emblem` n'existe plus. `setActive` ne
  déplace jamais la caméra : le défilement pilote, le consommateur appelle
  `setProgress(progressOf(id))`.
- **Disparu** : `activeId`, la navigation au clavier, les emblèmes (le troisième tableau du
  constructeur est maintenant `badges`).

### Badges : contrat des textures

- Créer le bitmap par `createImageBitmap(blob, { premultiplyAlpha: 'premultiply',
colorSpaceConversion: 'none', imageOrientation: 'none', resizeWidth, resizeHeight })`, 512 px au
  plus. Pour un `ImageBitmap`, WebGL ignore les réglages `UNPACK_*` : les options de création
  valent. Ils sont posés quand même (flip Y faux, pré-multiplication, conversion `NONE`).
- Le shader de la face (`shaders/badge.glsl`) écrit `texture(u_badge, v_uv)` et rien d'autre : aucun
  éclairage, brouillard, teinte ni multiplication. Mélange `ONE, ONE_MINUS_SRC_ALPHA` (canvas
  pré-multiplié). Un test vérifie le source du shader.
- `generateMipmap`, `LINEAR_MIPMAP_LINEAR`, `LINEAR`, `CLAMP_TO_EDGE`, anisotropie jusqu'à 8 si
  `EXT_texture_filter_anisotropic` existe (constantes 0x84FE et 0x84FF). Sans texture reçue : le
  support seul reste visible.
- Perte de contexte : les `ImageBitmap` sont **conservés côté Rust** (le plus simple : rien à
  redemander au réseau) ; `contextRestored` recrée les textures. Coût : au plus 24 bitmaps de
  512x512 en mémoire. `destroy()` supprime les textures et ferme les bitmaps ; remplacer un badge
  ferme l'ancien bitmap.

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

Comparaison de `"s"` et `"z"` (2026-11-21, ADR-0013, Rust 1.99.1, binaryen 132) :

| `opt-level` | avant wasm-opt (brut / brotli) | après wasm-opt -Oz (brut / gzip / brotli) |
| ----------- | ------------------------------ | ----------------------------------------- |
| `"s"`       | 176 912 o / 41 624 o           | 82 538 o / 37 792 o / **31 992 o**        |
| `"z"`       | 191 769 o / 42 988 o           | 81 943 o / 37 714 o / 32 221 o            |

`"s"` reste plus petit en brotli (le poids livré) de 229 octets. À refaire après un changement
important du code.

## Poids mesuré (jamais bloquant)

Cible de l'ADR-0013 : 45 Kio en brotli pour le `.wasm` (60 Kio dans l'ADR-0012).

| Fichier                            | avant ADR-0013 (brut / gzip / brotli) | après (brut / gzip / brotli) |
| ---------------------------------- | ------------------------------------- | ---------------------------- |
| `.wasm` avant wasm-opt             | 148 650 / 44 425 / 36 236             | 176 912 / 51 480 / 41 624    |
| `.wasm` après wasm-opt -Oz (livré) | 70 861 / 32 971 / 28 064              | 82 538 / 37 792 / 31 992     |
| glue JavaScript (`wasm-bindgen`)   | 23 810 / 5 511 / 4 887                | 28 403 / 6 566 / 5 833       |

Poids livré : 31,2 Kio en brotli pour le `.wasm` (cible de 45 Kio tenue, 13,8 Kio de marge), 36,9 Kio
avec la glue. La spline, les textures et le second programme coûtent 3,9 Kio en brotli ; la
suppression des emblèmes n'a pas suffi à les compenser. La CI écrit ce tableau dans son résumé.

`.wasm` existants, mesurés avant et après ce changement (même chaîne, mêmes octets) :

| Fichier                 | brut (o) | brotli (o) | SHA-256                                                            |
| ----------------------- | -------: | ---------: | ------------------------------------------------------------------ |
| `pp_color_wasm_bg.wasm` |   54 205 |     20 010 | `b62bcf7349ae12c4fb0647e84ca636cf01352f9a9d48f6ef0ec91757d39c36c3` |
| `pp_data_wasm_bg.wasm`  |   58 498 |     21 612 | `c482752316459397836e9080ae5f056f6884cf61825acf7eeccd79c3f0264196` |

Les deux sont reconstruits après un `cargo clean` de leurs crates, avec `wasm-bindgen` seul (sans
`wasm-opt`, comme leurs scripts) : octets identiques.

## Vérification dans les navigateurs

Fumée de l'ADR-0012 (avant l'ADR-0013, à refaire avec le lot de rendu ; hors dépôt, Playwright, scène de cinq jalons, rendu logiciel) : le `.wasm` se charge, la scène
se dessine, la glissade s'arrête au jalon actif, la sélection rend le bon identifiant et les entrées
invalides rendent leur code, sur les Chromium, Firefox et WebKit de Playwright. L'audit complet (perte de
contexte, Lighthouse, axe) est la brique #366.
