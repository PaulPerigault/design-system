# ADR-0012 — Scène 3D de jalons : Rust, WebGL2 et amélioration progressive

- Statut : proposé (2026-11-19), choisi par l'orchestrateur, en l'absence du propriétaire (consigne : trancher chaque point ouvert par une valeur par défaut écrite).
- Lié : ADR-0004 (CSP), ADR-0005 et ADR-0006 (Rust, architecture), ADR-0007 (parité des crates), D-030, D-106, D-194, chantier #360.

**En trois phrases.** Le design system gagne un composant générique qui affiche des jalons le long d'un ruban en perspective : médailles pleines pour les jalons atteints, fil de fer pour les jalons prévus. Le rendu est écrit en Rust (WebGL2 par `web-sys`, calcul par `glam`), enveloppé par un paquet TypeScript strict, et n'est qu'une amélioration d'une version HTML et CSS complète, qui reste la source de vérité. Aucune donnée métier n'entre dans le dépôt : le portfolio fournit ses certifications comme données.

## Contexte

Le portfolio veut une section « certifications » plus parlante qu'une liste. Le composant doit servir d'autres usages (parcours, feuille de route) : il est donc générique, sans vocabulaire de certification dans l'API. Le dépôt a déjà deux crates Rust compilés en WebAssembly (`pp-color`, `pp-data`), une chaîne de build du `.wasm`, une CI qui mesure son poids sans le bloquer (D-106), des composants Astro livrés en source, et un serveur MCP en lecture seule.

### Ce que la lecture du dépôt a établi (et qui contraint la conception)

1. **Les crates existent déjà** (`crates/pp-color`, `pp-color-wasm`, `pp-data`, `pp-data-wasm`). Règle de l'ADR-0006 : un crate métier est du Rust pur, un crate `-wasm` est mince et sans logique, `-wasm` dépend du métier, jamais l'inverse. Un rendu WebGL est de l'entrée-sortie : il va dans le crate `-wasm`, la logique (maths, géométrie, caméra, animation, état d'interaction, lecture du thème) va dans le crate métier.
2. **Le profil `release` du dépôt est `opt-level = "s"`** (`Cargo.toml` racine), pas `"z"`. Il est partagé par `pp-color-wasm` et `pp-data-wasm` : le changer pour tous modifierait leur poids publié. Cargo accepte un `opt-level` par paquet (`[profile.release.package.<nom>]`) ; `lto`, `codegen-units`, `panic` et `strip` restent ceux du profil racine, déjà conformes à la demande (`lto = true`, `codegen-units = 1`, `panic = "abort"`, `strip = true`).
3. **La chaîne de build n'utilise pas `wasm-pack`** : `packages/color/scripts/build-wasm.ts` lance `cargo build --target wasm32-unknown-unknown --release --locked`, puis `wasm-bindgen-cli` épinglé (0.2.130, même version que la dépendance), puis calcule l'empreinte SHA-256 et le poids. La CI fait de même (`cargo install --locked wasm-bindgen-cli@0.2.130`). `wasm-pack 0.15.0` est installé sur le poste mais le dépôt ne s'en sert pas.
4. **`wasm-opt` n'est installé ni sur le poste ni dans la CI.** La cible `wasm32-unknown-unknown` est déclarée dans `rust-toolchain.toml` (chaîne 1.99.1, édition 2024) et installée.
5. **`deny.toml` n'admet que `MIT` et `Unicode-3.0`.** `glam`, `web-sys` et `js-sys` sont en `MIT OR Apache-2.0` : l'expression est satisfaite par `MIT`. Les doublons de versions sont signalés, pas bloquants ; un `.wasm` en paie le poids.
6. **Pas de Taskfile dans le dépôt** : les commandes sont des scripts npm qui appellent des outils Node (`tools/`). `task` est installé sur le poste (WinGet), `go` aussi. La consigne de la session (Taskfile, jamais de PowerShell) l'emporte pour le nouvel audit ; les scripts npm existants ne changent pas.
7. **Les jetons sont des variables CSS `--pp-*` en `light-dark(oklch(...), oklch(...))`** (`packages/tokens/generated/tokens.css`), accent de teinte 270,7 ; durées `--pp-duration-base: 160ms` et `--pp-duration-fast: 100ms`, courbe `--pp-easing-standard: cubic-bezier(0.2, 0, 0, 1)` ; sous `prefers-reduced-motion: reduce`, les deux durées valent `0ms`. Le thème se force par `:root[data-theme='light'|'dark']` ou suit le système.
8. **La CSP du site (ADR-0004) admet déjà `'wasm-unsafe-eval'`** (Pagefind) et impose `style-src 'self'` sans `unsafe-inline`, `connect-src 'self'`. Un attribut `style` est donc interdit (aussi par `AGENTS.md`) ; la taille du canvas passe par une classe CSS, la résolution interne par les attributs `width` et `height` (propriétés du canvas, pas du style).
9. **Limites du dépôt applicables au Rust** (skill `encre-rust`) : fichier ≤ 120 lignes, fonction ≤ 40 lignes, complexité ≤ 8, aucun nombre magique, `#![forbid(unsafe_code)]`, ni `unwrap`, `expect`, `panic!` ni indexation non vérifiée hors tests, erreurs typées, `clippy::pedantic` en refus, `cargo audit` et `cargo deny` bloquants. Contrôles de CI du Rust : job `rust` (chemins `crates/`, `Cargo.*`, `deny.toml`) et job `wasm` ; les jobs sautés comptent comme réussis dans l'agrégat `ci`.
10. **Composants Astro** : publiés en source, zéro JavaScript par défaut, comportements opt-in dans `packages/astro/src/behaviors/`, propriétés logiques, cibles ≥ `--pp-target-min`, `role="list"` explicite sur les listes stylées. Un composant a un fragment de registre (`packages/astro/registry/items/`) vérifié par `check:registry`. Le composant le plus proche est `Timeline` (liste ordonnée, `time`, zéro JS).
11. **Tests et CI visuelle** : un seul projet Playwright `chromium` plus une matrice d'appareils, `@axe-core/playwright` présent ; la CI visuelle ne régénère que les pages modifiées. Aucun hook `pre-push` : `npm run verify` se lance à la main, la CI juge.
12. **MCP** : sept outils en lecture seule, alimentés par des données embarquées (`components.json`, `docs.json`, `adr.json`) régénérées et contrôlées par `check:mcp-data`. Un composant et un ADR y entrent par leurs sources, sans nouvel outil.
13. **Nom** : `@paulperigault/milestones-3d` est libre sur npm (404 au 2026-11-19). Les paquets existants portent un mot (`color`, `data`, `tokens`) ou `dataviz` ; un nom composé avec tiret est admis par npm.

### Sources externes (lues le 2026-11-19)

| Sujet                      | Source                                                                                                                                                                                                                                                                            | Ce qui en est retenu                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perte de contexte WebGL    | MDN, [WebGL best practices](https://developer.mozilla.org/en-US/docs/WebGL/WebGL_best_practices) ; Khronos, [Handling Lost Context](https://wikis.khronos.org/webgl/HandlingContextLost) ; [WEBGL_lose_context](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context) | `webglcontextlost` peut venir d'un manque de mémoire GPU ; sans `preventDefault()` sur l'événement, le contexte n'est pas marqué restaurable ; les ressources se recréent à `webglcontextrestored` ; perdre le contexte au plus tôt (`loseContext`) quand le rendu n'est plus utile ; l'extension sert aussi à simuler la perte en test |
| WebGL2, support            | [caniuse WebGL2](https://caniuse.com/webgl2) ; [web-features](https://web-platform-dx.github.io/web-features-explorer/features/webgl2)                                                                                                                                            | Chrome 56, Firefox 51, Edge 79, Safari 15 ; Baseline « Widely Available » depuis le 20 mars 2024. Le pourcentage global n'a pas pu être lu : il n'est pas cité                                                                                                                                                                          |
| `deviceMemory`, `saveData` | MDN, [Navigator.deviceMemory](https://developer.mozilla.org/docs/Web/API/Navigator/deviceMemory) ; caniuse, [deviceMemory](https://caniuse.com/mdn-api_navigator_devicememory), [saveData](https://caniuse.com/mdn-api_networkinformation_savedata)                               | « Limited availability », pas Baseline ; Chromium seulement en pratique, absents de Safari et de Firefox ; valeur grossière (puissance de deux) ; contexte sécurisé. Absence ne veut donc pas dire « appareil faible »                                                                                                                  |
| CSP et WebAssembly         | MDN, [script-src](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/script-src) ; [caniuse](https://caniuse.com/mdn-http_headers_content-security-policy_script-src_wasm-unsafe-eval)                                                                   | Sans `'wasm-unsafe-eval'` (ou `'unsafe-eval'`) sous une CSP, le WebAssembly est bloqué ; `'wasm-unsafe-eval'` n'autorise pas `eval()` ; Chrome 97, Firefox 102                                                                                                                                                                          |
| Mouvement, WCAG            | W3C, [2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) ; [2.3.3 Animation from Interactions](https://w3c.github.io/wcag/understanding/animation-from-interactions) ; technique C39 (`prefers-reduced-motion`)                                | 2.2.2 (niveau A) vise le mouvement lancé par la page ; 2.3.3 (AAA) le mouvement déclenché par une interaction, hors animation essentielle. La page 2.3.3 lue est celle de WCAG 2.1 : le texte de 2.2 est à relire avant de citer une formulation                                                                                        |
| `web-sys`                  | [docs.rs web-sys](https://docs.rs/web-sys) ; guide [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/)                                                                                                                                                                   | Presque toute l'API est derrière des features Cargo, une par type (`WebGl2RenderingContext`, `HtmlCanvasElement`…) ; on déclare la liste exacte, ce qui borne aussi le poids                                                                                                                                                            |
| `wasm-pack` et `wasm-opt`  | [wasm-pack book, configuration de `Cargo.toml`](https://rustwasm.github.io/wasm-pack/book/cargo-toml-configuration.html)                                                                                                                                                          | `wasm-opt` est actif par défaut en `release`, ses arguments se règlent dans `[package.metadata.wasm-pack.profile.release]` ; un retour de terrain dit que la configuration est ignorée quand le crate est dans un espace de travail. Le dépôt n'utilise pas `wasm-pack` : le réglage ne s'applique pas ici                              |
| Chargement et LCP          | web.dev, [Optimize LCP](https://web.dev/en/optimize-lcp/) ; [top CWV](https://web.dev/articles/top-cwv)                                                                                                                                                                           | Ne pas différer le contenu du LCP ; différer ce qui est hors du premier écran ; réserver les dimensions pour éviter les décalages de mise en page. Rien de lu ne parle de `canvas` : la règle appliquée ici est une déduction, à confirmer par l'audit                                                                                  |

Non établi, donc non affirmé : le gain de `-Oz` sur ce `.wasm`, le poids de `glam`, le pourcentage de WebGL2 dans le monde, le comportement exact de la sérialisation d'une couleur calculée dans les trois moteurs. Chacun est mesuré ou vérifié par une sous-issue.

### Pièges relevés

- **`getPropertyValue('--pp-color-accent')` rend le texte brut `light-dark(oklch(…), oklch(…))`**, pas une couleur résolue : une propriété personnalisée non enregistrée n'est pas calculée. Pour obtenir la couleur du thème courant, il faut appliquer le jeton à la propriété `color` d'un élément sonde et lire la `color` calculée (ou lire la valeur brute et choisir la branche selon `color-scheme`). Le format sérialisé (`oklch()`, `color()`, `rgb()`) peut différer d'un moteur à l'autre : le parseur accepte les trois et convertit en sRGB linéaire avec `pp-color`.
- **Les durées sont du texte** (`160ms`, `0ms`) et la courbe aussi (`cubic-bezier(0.2, 0, 0, 1)`) : elles sont analysées, jamais recopiées. Une courbe non reconnue ramène à une valeur de repli nommée.
- **`Float32Array::view` est `unsafe`** : incompatible avec `#![forbid(unsafe_code)]`. La géométrie est statique ; elle est sérialisée une fois en octets (`to_le_bytes`) et envoyée par `buffer_data_with_u8_array`. Aucune donnée par image ne traverse la frontière, sauf des uniformes.
- **Nombre de contextes WebGL actifs plafonné par les navigateurs** : un seul contexte par composant, `destroy()` appelle `loseContext()` et retire écouteurs, observateurs et ressources.
- **Un canvas sans texte** : libellés, dates et liens vivent dans le HTML. La 3D ne porte aucun sens qui ne soit pas écrit ailleurs (WCAG 1.4.1, 1.1.1).
- **iOS** demande une autorisation explicite, déclenchée par un geste, pour l'orientation de l'appareil : le gyroscope n'est pas sollicité là (aucune boîte de dialogue non demandée).
- **Les shaders contiennent des nombres** : règle « aucun nombre magique » et gardes de couleur ne voient pas le GLSL. Une règle dédiée (sous-issue 5) interdit couleurs, durées et courbes littérales dans les sources du crate.

## Décision

### 1. Modèle de données (générique, sans donnée métier)

```ts
type MilestoneStatus = 'achieved' | 'planned';
interface Milestone {
  id: string; // unique, [a-z0-9-]+
  label: string;
  group?: string; // émetteur, catégorie
  status: MilestoneStatus;
  date?: string; // 'AAAA-MM' ou 'AAAA-MM-JJ'
  href?: string; // https: ou chemin relatif, validé
  emblem?: EmblemKey; // clé d'emblème géométrique
}
interface Goal {
  label: string;
  href?: string;
} // cible finale facultative
interface MilestonesData {
  milestones: Milestone[];
  goal?: Goal;
}
```

Valeurs par défaut tranchées :

- **Emblèmes** : jeu fermé, fourni par le crate, `disc` (défaut), `check`, `shield`, `cloud`, `network`, `database`, `code`, `key`, `gear`. Une clé inconnue est une erreur de validation, pas un repli silencieux ; une clé absente donne `disc`. Ajouter un emblème est une évolution du crate, pas des données.
- **Ordre** : celui du tableau, comme `Timeline` ; le composant ne trie pas. Positions équidistantes sur le ruban (pas d'échelle de temps).
- **Bornes** : 1 à 24 jalons (`MAX_MILESTONES`). Au-delà, ou donnée invalide, `init` rejette avec une erreur typée et le composant garde le rendu classique. Validation à la frontière, une fois, côté TypeScript puis rejouée côté Rust (le crate ne fait pas confiance à l'appelant).
- **Langue** : le composant n'invente aucun texte ; formats de date via `Intl` côté Astro, dans la langue de la page.

### 2. Rendu

- **`achieved`** : médaille pleine, disque à épaisseur réelle (cylindre à 32 segments, bord biseauté), emblème en relief géométrique, éclairage simple (une lumière directionnelle fixe plus ambiante, ombrage de Lambert), légère inclinaison au pointeur ; au gyroscope là où il est disponible sans autorisation.
- **`planned`** : même contour en fil de fer (`LINES`), sans emblème plein ; teinte atténuée par jeton.
- **Ruban** : bande plane suivant une courbe en perspective ; la caméra glisse le long du ruban vers le jalon actif. **Cible finale** : contour distinct en bout de ruban (aucune médaille).
- **Aucune boucle d'animation au repos** (voir 5) : le seul mouvement est une transition vers un jalon actif et l'inclinaison au pointeur.
- Fond du canvas transparent : la page garde son fond, aucun écart de teinte au changement de thème.

### 3. Techno et découpage des crates

- **`crates/pp-milestones`** (Rust pur, sans `wasm-bindgen` ni `web-sys`) : `geometry` (maillages des médailles, ruban, fil de fer, emblèmes, sérialisation en octets), `camera`, `animation` (courbe de Bézier cubique, interpolation, temps injecté), `interaction` (machine d'états : actif, inclinaison lissée et bornée), `theme` (lecture et conversion des couleurs via `pp-color`, durées, courbe), `data` (validation du contrat), `error` (énumération `SceneError`). Dépend de `glam` et de `pp-color` (chemin du dépôt).
- **`crates/pp-milestones-wasm`** : `gl` (contexte, perte et restauration), `shaders` (sources GLSL ES 3.00 dans des fichiers `.glsl`, compilation, liaison), `draw` (tampons, uniformes, appels de dessin), `bindings` (types exposés à JavaScript). Dépend de `pp-milestones`, `wasm-bindgen` (version exacte, comme les autres) et `web-sys` (features listées une à une). Cette couche est de l'entrée-sortie : elle appelle WebGL, elle ne décide rien. C'est une application étendue de la règle « crate `-wasm` mince » de l'ADR-0006 : « sans logique » devient « sans logique métier, seulement des appels de plateforme ».
- **Pas de `wgpu`, `three-d`, `bevy`** : poids et dépendances sans commune mesure avec le besoin (une dizaine de maillages statiques). Décision de l'utilisateur, confirmée par la lecture : budget visé 60 Ko brotli.
- **Profil** : `opt-level = "z"` pour les deux crates par `[profile.release.package.pp-milestones]` et `…-wasm`, le reste du profil racine inchangé (`lto`, `codegen-units = 1`, `panic = "abort"`, `strip`). Le profil racine reste `"s"` : `pp-color-wasm` et `pp-data-wasm` ne bougent pas. Si `"s"` mesure plus petit que `"z"` sur ce crate (arrive avec `lto`), la mesure l'emporte et la sous-issue 1 le consigne.
- **`wasm-opt -Oz`** : appelé par un script du dépôt après `wasm-bindgen`, avec `binaryen` en dépendance de développement à version exacte (paquet npm qui embarque `wasm-opt`, registre npm seulement, donc compatible avec `check:lockfile`). Alternative écartée : `wasm-pack`, que le dépôt n'utilise pas. Le script échoue clairement si `wasm-opt` manque, au lieu de sauter l'étape en silence ; le poids affiché dit s'il est passé.
- **Wrapper TypeScript strict** `@paulperigault/milestones-3d` (paquet public, même modèle de publication et de provenance que `@paulperigault/color`) :
  ```ts
  init(canvas: HTMLCanvasElement, data: MilestonesData, theme: Theme,
       options?: { dprMax?: number; activeId?: string; onSelect?: (id: string) => void;
                   onFallback?: (reason: FallbackReason) => void })
    : Promise<{ destroy(): void; setTheme(theme: Theme): void; setActive(id: string): void }>
  ```
  plus `readTheme(root: Element): Theme` (voir Design) et `canEnhance(env): boolean` (voir Repli), qui sont de la logique pure à dépendances injectées. Aucun rendu côté TypeScript : il charge le `.wasm`, valide, branche les écouteurs et relaie.

### 4. Design : aucune couleur, durée ni courbe en dur

- La scène ne contient aucune couleur ni durée littérale. `readTheme` lit les jetons nécessaires (`--pp-color-bg`, `-fg`, `-accent`, `-on-accent`, `-line`, `-muted`, `--pp-duration-base`, `--pp-duration-fast`, `--pp-easing-standard`) par la sonde décrite plus haut, et les convertit en sRGB pour les uniformes. Liste fermée dans `THEME_TOKENS`, vérifiée par `check:tokens` côté Rust (sous-issue 5) : un jeton cité doit exister.
- **Thème clair/sombre** : le composant observe `data-theme` sur `:root` (`MutationObserver`) et `prefers-color-scheme` (`matchMedia`), relit le thème et appelle `setTheme()`. Un seul rendu à la demande suit.
- **Mouvement** : durées et courbe viennent des jetons. Les durées valent `0ms` sous `prefers-reduced-motion`, mais le comportement est plus strict : pas de 3D du tout (voir Repli).
- Contraste : médailles et fil de fer sont portés par `accent`, `muted` et `line`, déjà validés par `roles.json` sur `bg` ; le canvas étant `aria-hidden` et doublé par du texte, aucun critère de non-texte n'est porté par lui seul.

### 5. Repli et amélioration progressive

- Le composant Astro rend **toujours** la version classique complète : liste ordonnée (`<ol role="list">`), un `<li>` par jalon avec `time`, libellé, groupe, statut écrit en toutes lettres (pas seulement une forme), lien éventuel, puis la cible finale. Indexable, lisible sans JavaScript, sans WebGL. C'est la source de vérité ; les données de la scène sont dérivées de ce même tableau (un seul `data` passé à `Props`, sérialisé en JSON dans un `<script type="application/json">` : la CSP `script-src 'self'` n'exécute pas ce bloc, qui est une donnée).
- **La liste n'est jamais retirée ni masquée** : en mode amélioré elle devient le sélecteur (boutons ou liens, cibles ≥ `--pp-target-min`) et l'unique lieu du texte. Le panneau de détail du jalon actif est du HTML. Le canvas est `aria-hidden="true"`, hors ordre de tabulation, avec `touch-action: pan-y` pour ne pas voler le défilement.
- **Le comportement** (`packages/astro/src/behaviors/milestones-3d.ts`) charge le paquet par `import()` dynamique, seulement si **toutes** les conditions tiennent : `WebGL2` disponible (test sur un canvas jetable), pas de `prefers-reduced-motion: reduce`, pas de `saveData` à `true`, appareil non faible, section visible (`IntersectionObserver`).
- **Appareil faible** : `hardwareConcurrency <= 2` **ou** `deviceMemory <= 2`, avec une réserve que la consigne ne disait pas : une valeur **absente** (Firefox, Safari) ne compte jamais comme faible, car l'absence n'est pas une mesure (sources ci-dessus). Valeurs en constantes nommées `WEAK_CORES`, `WEAK_MEMORY_GB`.
- **Chargement** : l'observateur a une marge pour que le chargement démarre avant l'entrée dans le viewport (pas de décalage visible). Si la section est déjà dans le premier écran au chargement, l'amélioration attend le premier geste de l'utilisateur ou l'inactivité du navigateur, pour ne pas toucher au LCP (le contenu classique en est l'élément). À confirmer par l'audit (CLS ≤ 0,1, LCP inchangé).
- **Échec** : erreur d'`init` (contexte refusé, `.wasm` non chargé, shader refusé, donnée invalide) → `onFallback(raison)`, `destroy()`, retour au rendu classique, rien de plus visible qu'un mode « liste ». **Perte de contexte** : `preventDefault()`, pause ; si `webglcontextrestored` n'arrive pas avant `CONTEXT_RESTORE_TIMEOUT_MS` (2 000), repli définitif comme ci-dessus ; si la restauration réussit, les ressources sont recréées et le rendu reprend.
- **Économie** : rendu à la demande (`requestAnimationFrame` seulement pendant une transition ou une inclinaison en cours, aucune boucle au repos) ; pause hors écran (`IntersectionObserver`) et onglet masqué (`visibilitychange`) ; DPR plafonné à 2 (`dprMax`) ; `ResizeObserver` pour la taille ; `destroy()` retire écouteurs et observateurs, libère tampons, programmes et contexte (`loseContext`).
- **WCAG** : pas de mouvement automatique donc rien à mettre en pause (2.2.2) ; le mouvement déclenché par une interaction est non essentiel et désactivé sous `prefers-reduced-motion` (2.3.3, AAA, retenu par prudence) ; le canvas n'est jamais le seul moyen d'accès (2.1.1, 1.1.1).

### 6. Sécurité et CSP

- Aucune dépendance réseau : le `.wasm` est servi par le même domaine (`script-src 'self' 'wasm-unsafe-eval'`, `connect-src 'self'` pour son chargement). Pour le site de documentation, aucun changement d'en-tête : `'wasm-unsafe-eval'` y est déjà. Pour un site consommateur (le portfolio), l'en-tête doit l'avoir : à écrire dans la documentation de la sous-issue 4, avec le test `csp.spec.ts` étendu à la page de démonstration.
- `#![forbid(unsafe_code)]` dans les deux crates, `cargo audit` et `cargo deny` bloquants, aucun `style` en ligne, `href` des jalons validé (schémas `https:` ou chemin relatif, jamais `javascript:`), aucune donnée interpolée dans le GLSL.

### 7. Budget GreenOps

- Mesurer et publier, dans le résumé de la CI (comme `pp-color`) et dans la page de documentation : taille du `.wasm` brut, gzip et **brotli** (cible **60 Ko brotli**), taille de la glue JavaScript, poids du comportement Astro. Mesure avant et après `wasm-opt`. Dépasser un peu n'est pas bloquant (D-106) : la PR l'écrit et dit ce qui a été tenté (features `web-sys`, `glam` sans fonctionnalités par défaut, suppression des chemins d'erreur formatés, géométrie générée plutôt que stockée).
- Aucune dépendance d'exécution côté navigateur autre que le `.wasm` et sa glue. Zéro octet de 3D pour qui n'active pas le comportement (import dynamique, `sideEffects: false`).

### 8. Tests

- **`cargo test`** (crate métier) : maths de caméra, easing (bornes 0 et 1, monotonie, par `proptest`), interpolation, géométrie (nombre de sommets, indices dans les bornes, normales unitaires), machine d'états de l'interaction, validation du contrat, analyse des couleurs, durées et courbes, conversion OKLCH vers sRGB (parité avec `pp-color`).
- **Vitest** (wrapper) : validation, `canEnhance` (une table de cas : WebGL2 absent, mouvement réduit, `saveData`, cœurs, mémoire, valeur absente, section invisible), `readTheme` avec sonde injectée, repli sur échec d'`init`, perte et restauration de contexte avec un faux contexte, `destroy()` sans fuite (compteurs d'écouteurs).
- **Composant Astro** : rendu du HTML classique complet sans JS, attributs `aria`, liens, statut en toutes lettres, bloc de données, cas limites (un seul jalon, 24 jalons, libellé long, sans date, sans groupe, sans cible).
- **Pas de e2e global.** Le visuel (Playwright, `visual.yml`) ne s'exécute que si la page de démonstration change, et ne compare que le rendu classique : un canvas WebGL n'est pas reproductible octet pour octet entre moteurs. Aucun contrôle refait en hook : la CI vérifie, le hook local garde `commitlint` et `lint-staged`.
- **Audit web à la demande** : `task audit:milestones-3d` (Taskfile à la racine, ajouté par la sous-issue 6 ; il appelle un script Node du dépôt, rien de plus). Il lance, sur la page de démonstration construite : Lighthouse (version épinglée), Playwright sur Chromium, Firefox et WebKit, axe sur les états classique et amélioré, simulation de perte de contexte (`WEBGL_lose_context`), `prefers-reduced-motion`, `saveData` simulé, CLS et LCP mesurés. En CI, un job dédié ne s'exécute que sur les PR qui touchent `crates/pp-milestones*`, `packages/milestones-3d`, le composant, ses styles ou sa page de démonstration (même mécanisme de filtre de chemins que les jobs `rust` et `wasm` ; sauté, il compte comme réussi dans l'agrégat `ci`).

### 9. Livraison

- Paquet `@paulperigault/milestones-3d` (nom confirmé libre ; conforme au motif `@paulperigault/<nom>`), publié par `release-please` et le workflow `release` existants, avec provenance. Aucune publication manuelle. Il est ajouté à `release-please-config.json`, à `check:pack` et aux couches de `pp-guards.config.json`.
- **Sens des dépendances** : `tokens ← css ← astro` inchangé ; `@paulperigault/milestones-3d` ne dépend d'aucun autre paquet npm à l'exécution (les couleurs passent par `pp-color` compilé dans son propre `.wasm`, pas par `@paulperigault/color`). `@paulperigault/astro` le déclare en **`peerDependencies` facultative** : absent, l'import dynamique échoue et le rendu classique reste, sans erreur visible.
- **Composant** `Milestones3D` dans `@paulperigault/astro` (nom du composant : `JourneyRibbon` écarté, il parle de la forme et non du contrat), fragment de registre, entrée dans `create add`. **Styles** dans `@paulperigault/css` (couche de mise en page : emplacement du canvas, sélecteur compact, état `data-enhanced`) ; aucun style dans le paquet 3D.
- **Documentation** : page de démonstration et de documentation dans `apps/docs` (jeux de données fictifs, jamais de certifications réelles), mesures de poids, section CSP, section accessibilité.
- **MCP** : pas de huitième outil. Le composant entre dans `components.json` par le registre, la page dans `docs.json`, l'ADR dans `adr.json` ; `check:mcp-data` et `check:mcp-self-test` le vérifient.
- **Gardes** (`pp-guards`) : couche `milestones-3d` ajoutée ; nouvelle règle qui refuse, dans `crates/pp-milestones*/src` et le paquet TypeScript, toute couleur littérale (`#rrggbb`, `rgb(`, `oklch(`, `vec3(` de couleur), toute durée (`ms`, `s`) et toute `cubic-bezier(` hors de la liste des jetons et des tests ; contrôle que `THEME_TOKENS` ⊂ jetons existants.
- **Étiquette** : `labels.json` n'a pas `pkg:milestones`. La sous-issue 1 l'ajoute (par `sync-labels.mjs`), ainsi que l'option du champ « Paquet » du Project et des formulaires. D'ici là, les issues portent le label du paquet le plus proche (`pkg:astro`) et le disent dans leur corps.

## Découpage (une PR par sous-issue, « Closes » sur la dernière du chantier)

1. Crates Rust `pp-milestones` et `pp-milestones-wasm`, build, `wasm-opt`, poids.
2. Paquet TypeScript `@paulperigault/milestones-3d` : wrapper strict, `readTheme`, `canEnhance`, tests.
3. Composant Astro `Milestones3D`, comportement, registre, styles `@paulperigault/css`.
4. Page de documentation et de démonstration dans `apps/docs`, CSP, mesures.
5. Entrée MCP (données régénérées), règles et couche `pp-guards`, étiquette `pkg:milestones`.
6. Audit web : tâche Taskfile `audit:milestones-3d`, job de CI conditionnel.

Ordre : 1 → 2 → 3 → 4 ; 5 après 3 ; 6 après 4.

## Conséquences

- Un troisième couple de crates et un paquet npm de plus à entretenir ; poids visé 60 Ko brotli, mesuré à chaque PR, jamais bloquant.
- La logique testable reste hors de la couche plateforme : `cargo test` couvre l'essentiel sans navigateur ; la couche WebGL est couverte par l'audit en navigateurs réels.
- Pour les sites consommateurs : `'wasm-unsafe-eval'` doit figurer dans `script-src`, faute de quoi le repli classique s'applique, sans erreur.
- Premier usage de `Taskfile.yml` dans le dépôt : outil de poste, non requis par la CI (la CI appelle directement le script Node).
- Un ajout de dépendance de développement (`binaryen`, `lighthouse`) : justifié, versions exactes, contrôlé par `check:lockfile` et la revue de chaîne d'approvisionnement.

## Points ouverts, tranchés par défaut

- Gyroscope : activé seulement sans demande d'autorisation (pas d'iOS) ; défaut modifiable plus tard par une option, jamais par une invite imposée.
- Échelle de temps proportionnelle : non, positions équidistantes.
- Nombre de segments des médailles (32) et d'emblèmes (9) : constantes nommées, ajustables si le budget l'exige.
- Si `wasm-opt` via `binaryen` s'avère inutilisable sous Windows : la sous-issue 1 le consigne, la CI Linux fait foi, l'étape reste obligatoire en CI.
- Jalon de rattachement : M3 « migration du portfolio » (le portfolio est le premier consommateur) ; aucun jalon n'est créé.

## Alternatives écartées

- **Tout en un seul crate** avec `web-sys` : viole l'ADR-0006 (le métier ne se teste plus sans navigateur) et interdit la réutilisation.
- **`wgpu` ou `three-d`** : poids et surface sans rapport ; demande explicite de ne pas les utiliser.
- **Three.js en TypeScript** : dépendance d'exécution lourde, contraire à GreenOps et à `AGENTS.md` ; écarté par la demande (Rust).
- **3D seule, sans version classique** : inaccessible sans JavaScript ni WebGL, non indexable.
- **Lecture directe de `getPropertyValue` des jetons** : rend du texte `light-dark(…)` non résolu (voir Pièges).
- **Boucle `requestAnimationFrame` permanente** : coût d'énergie sans usage, et mouvement automatique soumis à WCAG 2.2.2.
- **Changer le profil racine en `"z"`** : modifierait le poids publié des deux paquets existants.
