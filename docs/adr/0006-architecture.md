# ADR-0006 — Architecture : couches, résultats typés, composants, Rust, sobriété

- Statut : proposé (2026-10-28). Documentation seulement : aucune migration de code par cet ADR.
- Lié : ADR-0005 (TypeScript strict, Rust), D-030, D-035, D-037, AGENTS.md (limites de code),
  issue #82. Cadre les étapes 3 à 11 et le lot analyse V1 à V5.

## Contexte

Le dépôt est un projet personnel qui peut devenir open source. Exigences de Paul : standards
propres, code de niveau senior en briques indépendantes, découpage assez fin pour Sonnet, Rust sans
obligation de gain (D-030) mais sans régression, site statique sur Cloudflare Pages avec du
WebAssembly, crates partageables avec un futur back Rust et Go, personnalisation d'un projet externe
par une variable de couleur et une de typographie. Les paquets d'outillage sont aujourd'hui des
fichiers à plat (`packages/guards/src` : une trentaine de fichiers et de dossiers au même niveau).

## Décision 1 : Clean Architecture et DDD pour les outils

Périmètre : `guards`, `create`, `mcp`, générateur de `tokens`, `web-presence`, `tools/agents`.
Les composants Astro et le CSS n'y sont pas soumis (décision 3).

Structure type d'un paquet :

- `src/domain/` : règles pures (types, fonctions, valeurs), aucune E/S.
- `src/application/` : cas d'usage, qui orchestrent le domaine via des ports ; `ports.ts` déclare les
  interfaces (FS, horloge, process, fetch), c'est l'inversion de dépendance.
- `src/infrastructure/` : adaptateurs (fs, réseau, CLI avec `parseArgs`, sortie console).
- `src/errors.ts` : erreurs typées du paquet, une union fermée ; `src/index.ts` : API publique.
- `test/` : miroir de `src/` ; le domaine se teste sans double.

- **Règle de dépendance vers l'intérieur** : `infrastructure → application → domain`. `domain`
  n'importe rien d'autre que lui-même et les types ; `application` n'importe que `domain` et ses
  ports. Seule `infrastructure` (et `bin`) touche `node:*`. `guards` refuse un import qui viole la
  règle (étape 3), comme il refusera celui qui remonte `tokens ← css ← astro`.
- **Ports** : interfaces TypeScript (`FileSystem`, `Clock`, `Process`, `Fetcher`) déclarées côté
  application, implémentées en infrastructure, injectées au point d'entrée. C'est déjà la pratique
  de `create` (FS injecté) ; elle devient la règle.
- **Erreurs typées centralisées** : une union discriminée par paquet dans `errors.ts` (champ `code`
  littéral, message, contexte), comme le prévoit ADR-0005 ; aucune erreur anonyme franchit une frontière.
- **DTO validés à chaque frontière** : tout ce qui entre (JSON, arguments de CLI, fichier, réponse
  réseau, sortie WebAssembly) passe par une fonction de validation de l'infrastructure qui produit
  un type du domaine ou une erreur typée. Le domaine ne reçoit jamais de donnée non validée.
- **SRP et limites** : une responsabilité par module ; fichier ≤ 120 lignes, fonction ≤ 40,
  complexité ≤ 8, profondeur ≤ 3, ≤ 4 paramètres. On découpe, on ne relève jamais la limite.
- **DDD, sans cérémonie** : le vocabulaire du domaine (jeton, contrôle, violation, composant) nomme
  les types ; pas d'agrégats ni de dépôts génériques là où une fonction pure suffit.

## Décision 2 : Effect-TS non adopté dans le cœur, option facultative plus tard

Effect-TS : non adopté dans le cœur. Prévu plus tard comme OPTION FACULTATIVE, hors cœur : un
paquet séparé (`@paulperigault/effect` : adaptateurs des ports en `Layer`, erreurs typées,
validation `Schema`) et une option de la CLI `create` (Effect oui/non). Les paquets du cœur n'ont
aucune dépendance à Effect ; les ports restent des interfaces TypeScript et le domaine reste pur,
ce qui rend l'ajout possible sans réécriture. À réaliser après les chantiers en cours ; évaluer
alors le serveur MCP effect-mcp (https://github.com/niklaserik/effect-mcp) pour limiter les erreurs
d'API avec Sonnet.

Le cœur garde un type `Result` maison dans `domain/` de chaque paquet (ou un module commun de
`tokens` s'il est partagé).

| Critère                | Effect-TS                                                       | Résultats maison                       |
| ---------------------- | --------------------------------------------------------------- | -------------------------------------- |
| Poids d'exécution      | dépendance d'exécution de plusieurs centaines de ko (à mesurer) | zéro octet, zéro dépendance            |
| Courbe d'apprentissage | forte : fibres, couches, `Effect.gen`, `pipe`                   | faible : union `{ ok, … }` (ADR-0005)  |
| Lisibilité             | style fonctionnel propre à la bibliothèque                      | TypeScript courant                     |
| Node 24                | compatible                                                      | compatible                             |
| Sécurité, chaîne       | grosse surface, mises à jour fréquentes à auditer               | rien à auditer                         |
| Contributeurs, Sonnet  | apprentissage requis, erreurs de typage difficiles à lire       | schéma que tout modèle écrit sans aide |

Raisons du refus dans le cœur : D-030 et la sobriété (décision 5) imposent « aucune dépendance
d'exécution inutile » ; les paquets publiés `guards`, `create` et `tokens` n'ont aucune dépendance
d'exécution ; les ports injectés (décision 1) couvrent déjà l'injection, les erreurs typées et les
tests sans E/S. L'option reste utile à qui bâtit un site ou une application et veut Effect : elle
se branche aux ports sans toucher au cœur.

## Décision 3 : composants Astro

- **Sans couches** : un composant est un fichier `.astro` (≤ 120 lignes) avec son CSS scopé, ses
  types de propriétés et son test. La séparation domain/application/infrastructure ne s'y applique
  pas ; la logique non triviale (tri, calcul, mappage de variantes) vit dans un module `.ts` pur testé.
- **Zéro JS par défaut** ; un comportement (`behaviors`) est une île optionnelle, activée par
  attribut, qui garde un repli utilisable sans script.
- **Accessibles par conception** : sémantique native d'abord, nom accessible exigé par le type
  quand le rôle l'impose, cibles ≥ `--pp-target-min`, propriétés logiques, pas de `style` en ligne
  (AGENTS.md). Le test axe fait partie de la définition de fini.
- **Polymorphisme limité** : une propriété `as` n'accepte qu'une liste fermée de balises, typée par
  composant (par exemple `'div' | 'section' | 'article'`). Pas de balise libre, pas de `...rest`
  non filtré. Les variantes passent par des attributs `data-*` mappés en CSS.
- **Modulables** : composition par `<slot />` et variantes nommées ; aucune valeur brute, tout
  passe par `--pp-*`.
- **Contrat de personnalisation d'un projet externe** (à écrire plus tard, décrit ici seulement) :
  - une variable pour la couleur d'accent : une teinte (OKLCH) dont dérivent l'accent, son survol,
    `--pp-color-on-accent` et leurs variantes sombres, avec contraste WCAG 2 contrôlé à la dérivation ;
  - une variable pour la typographie : la pile de la famille de texte, dont dérivent
    `--pp-font-family-sans` et les échelles ; la police est servie par le projet, hors du paquet ;
  - toute autre valeur garde son défaut ; surcharger un jeton reste possible mais hors contrat ;
  - le contrat est stable (versionné, listé dans la documentation et le MCP) ; un changement
    cassant suit semver. Sa réalisation est un point ouvert (n° 2).

## Décision 4 : politique Rust et WebAssembly (D-030)

- **Critères d'adoption** : parité de comportement prouvée en CI contre la référence TypeScript
  (écart ≤ 1e-6 sur les composantes, ratio arrondi identique) ; poids du `.wasm` budgété et
  contrôlé ; temps de chargement non dégradé (mesuré avant et après) ; ni `panic` ni `unwrap`
  (`expect`, indexation non vérifiée) hors tests ; erreurs typées (`thiserror` ou enum maison).
  Aucun gain de performance n'est exigé, aucune régression n'est tolérée.
- **Espace de travail Cargo** : `Cargo.toml` racine (`[workspace]`), `crates/pp-color` (OKLCH,
  sRGB, gamut, contraste WCAG 2 et APCA), `crates/pp-data` (agrégation, quantiles,
  sous-échantillonnage). Les crates sont du Rust pur, sans dépendance à `wasm-bindgen` ; la liaison
  WebAssembly vit dans des crates `-wasm` minces, de sorte qu'un back Rust ou Go (via une
  bibliothèque C ou un binaire) réutilise les crates sans le glue JavaScript.
- **Build** : le `.wasm` est compilé en CI et publié dans le paquet npm (`@paulperigault/color`,
  puis celui de `pp-data`). Le build Cloudflare n'installe ni `rustup` ni `cargo` ; il consomme le
  paquet. Le TypeScript reste la référence tant que la parité n'est pas établie.
- **Outillage** : `rust-toolchain.toml` épinglé ; `cargo clippy -- -D warnings -W clippy::pedantic`
  (pedantic en refus) ; `cargo fmt --check` ; `cargo audit` ; `cargo deny` ; `cargo test`, plus
  `proptest` pour les propriétés (aller-retour OKLCH, bornes du gamut). Limites de taille du dépôt
  appliquées au Rust.
- **Réexamen d'ADR-0005 (garde-fous)** : sa décision reste valable pour le temps d'exécution
  actuel (0,2 s mesuré, aucun goulot établi) mais le critère « seulement si une mesure le
  justifie » ne s'applique plus : D-030 n'interdit plus Rust, qui peut y être adopté sans gain mesuré.

## Décision 5 : Green IT et FinOps (détail à l'étape 10, #102)

- Un budget de poids par page et par ressource (HTML, CSS, JS, police, image, `.wasm`), bloquant en CI.
- Une estimation carbone par page, méthode à choisir et à sourcer à l'étape 10.
- Rester dans l'offre gratuite de Cloudflare Pages (builds, bande passante, requêtes) ; surveiller.
- Aucune dépendance d'exécution inutile : chaque ajout est justifié par écrit (ex. Effect-TS, hors cœur).
- Zéro JS par défaut, images au plus juste, polices limitées : la sobriété est une contrainte de conception.

## Décision 6 : ordre d'application

| Étape    | Issue    | Ce que l'ADR impose                                                                                                           |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 3        | #83      | `guards` : structure type (décision 1), contrôle de la règle de dépendance vers l'intérieur et du sens `tokens ← css ← astro` |
| 4        | #84      | `create` migré vers la structure type ; ports FS et process conservés ; validation des DTO (arguments)                        |
| 5        | #85      | `mcp` et générateur de tokens : structure type, DTO validés à la lecture des données                                          |
| 6        | #86      | `tools/agents` : structure type ; `dist/` pour chaque paquet publié                                                           |
| 7a       | #88      | `crates/pp-color` dans un espace de travail Cargo ; clippy pedantic ; sans dépendance `wasm-bindgen`                          |
| 7b       | #89      | parité TypeScript/Rust en CI aux seuils de la décision 4 ; contraste WCAG 2 et APCA                                           |
| 8        | #90      | `.wasm` compilé en CI, budget de poids, temps de chargement mesuré ; build Cloudflare sans Rust                               |
| 9        | #91      | mesure d'images selon les budgets de la décision 5                                                                            |
| 10       | #102     | budgets de poids, carbone, offre gratuite (décision 5) ; contrat de personnalisation si retenu                                |
| 11       | #103     | Dependabot Cargo ; `cargo audit` et `cargo deny` en CI ; documentation de l'architecture                                      |
| V1       | #93      | ADR données : palettes dérivées du contrat d'accent, composants selon la décision 3                                           |
| V2a, V2b | #94, #95 | composants sans couches, polymorphisme fermé, zéro JS                                                                         |
| V3a, V3b | #96, #97 | idem ; cibles ≥ `--pp-target-min`                                                                                             |
| V4a      | #98      | `crates/pp-data` : mêmes critères que `pp-color`                                                                              |
| V4b      | #99      | `.wasm` de `pp-data` : parité, budget de poids, build sans Rust côté Cloudflare                                               |
| V5       | #100     | page de démonstration soumise aux budgets de poids de la décision 5                                                           |

**Critères d'acceptation à changer** (issues non modifiées par cet ADR) :

- #83 : ajouter « le contrôle de dépendance vers l'intérieur (`domain` n'importe pas `application`
  ni `infrastructure`) est testé » ; le périmètre est fixé par la décision 1.
- #84, #85, #86 : ajouter « structure `domain/application/infrastructure`, erreurs dans `errors.ts` »
  et « DTO validés aux frontières ».
- #88, #89, #98 : remplacer « `cargo clippy` sans avertissement » par « clippy pedantic en refus,
  `cargo fmt --check`, `cargo audit` et `cargo deny` verts » ; ajouter « crate sans `wasm-bindgen` ».
- #90, #99 : ajouter « temps de chargement mesuré avant et après, non dégradé » et « build Cloudflare
  sans Rust ».
- #94 à #97, #100 : ajouter « polymorphisme limité à une liste fermée de balises » et « budget de
  poids de la page ».
- #102 : ajouter « budget bloquant par ressource ; offre gratuite Cloudflare surveillée ».
- #103 : ajouter « `cargo audit` et `cargo deny` en CI ».

## Points ouverts et risques

1. Méthode d'estimation carbone (étape 10) : à choisir et à sourcer ; aucune n'est retenue ici.
2. Où et quand réaliser le contrat « une variable pour l'accent, une pour la typographie » : étape
   de `tokens` à créer ; le nom des variables reste à fixer.
3. Liaison d'un futur back Go aux crates : bibliothèque C, binaire ou WebAssembly (WASI) ; à trancher à l'arrivée du back.
4. Migration des paquets vers la structure type : risque de découpage mécanique qui multiplie les
   fichiers sans clarté ; vérifié à la revue à chaque étape (une étape, une PR).
5. Risque : deux langages à maintenir (TypeScript et Rust) ; parade : la parité en CI est bloquante
   et le TypeScript reste la référence jusqu'à son établissement.
