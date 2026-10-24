# ADR-0005 — TypeScript strict, puis Rust en WebAssembly seulement si une mesure le justifie

- Statut : proposé (2026-10-24). Rien de Rust n'est implémenté par cet ADR.
- Lié : AGENTS.md (limites de code), ADR-0003 (MCP), D-025.

## Contexte

Les paquets d'outillage sont en `.mjs` (mesuré le 2026-10-24) : `tokens` 15 fichiers / 1 113 lignes,
`guards` 42 / 3 096, `create` 32 / 2 277, `tools/agents` 40 / 2 285, `mcp` 17 / 1 670. Seuls
`astro` (135 fichiers `.ts` et `.astro`) et `apps/docs` sont typés. Les entrées externes (JSON de
tokens, arguments de CLI, fichiers lus) n'ont aucune garantie de forme à l'exécution.

Côté performance, les contrôles complets (`pp-guards all`) tournent en environ 0,2 s sur ce dépôt
(mesure locale, Node 24, macOS). Aucun goulot n'est établi.

## Décision 1 : TypeScript strict partout (priorité)

Périmètre : tout le code exécutable du dépôt, hors scripts de configuration tiers.

- `tsconfig.base.json` : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `verbatimModuleSyntax`. Le gabarit `astro/tsconfigs/strictest` les couvre déjà
  en partie ; on les écrit explicitement pour ne pas dépendre d'Astro.
- ESLint : `@typescript-eslint/no-explicit-any` en erreur ; assertions `as` interdites sauf
  commentaire de justification (`consistent-type-assertions` en `never`, dérogation locale
  `// justifié : …`).
- Exécution : Node 24 retire les types à l'exécution (`.ts` direct, syntaxe effaçable seulement :
  pas d'`enum`, de `namespace` ni de paramètres-propriétés). Imports avec extension `.ts`. Si un
  paquet publié a besoin de JS (consommateurs sous Node < 24), `tsc` produit `dist/`.
- Conception : unions discriminées pour les résultats (`{ ok: true, … } | { ok: false, error }`),
  erreurs typées (classes dérivées d'`Error` avec un champ `code` littéral), validation à chaque
  frontière (JSON, `parseArgs`, lecture de fichier) avant d'entrer dans la logique pure.

Ordre de migration, un paquet par PR, du plus petit au plus gros : `packages/tokens`, `packages/guards`,
`packages/create`, `tools/agents`. `packages/mcp` suit si les crédits le permettent.

Mesures à prendre avant et après chaque PR : nombre d'erreurs `tsc --noEmit`, nombre d'`any` et
d'assertions `as` (cible 0 hors justifiées), temps de `npm test`, et taille de `npm pack --dry-run`.

## Décision 2 : Rust en WebAssembly, par étapes conditionnelles

**Étape A : crate `pp-color`**, compilée en WebAssembly. Contenu : conversions OKLCH ↔ sRGB,
projection de gamut, contraste WCAG 2 et APCA. Aujourd'hui ce code vit dans `tokens/color` et
`tokens/contrast` (TypeScript). La raison d'être est la **référence unique et vérifiable** : des
fonctions pures, sans entrée-sortie, au contrat étroit. Garde-fous :

- tests de parité : les mêmes vecteurs passent par l'implémentation TypeScript et par le WASM, écart
  admis ≤ 1e-6 sur les composantes et identité exacte du ratio arrondi à deux décimales ;
- `proptest` : aller-retour OKLCH → sRGB → OKLCH, bornes du gamut, symétrie et plage du contraste ;
- l'API TypeScript ne change pas ; le WASM est chargé derrière la même interface.

**Étape B : moteur des garde-fous en Rust, seulement si une mesure le justifie.** Seuil proposé :
si `pp-guards all` dépasse 5 s sur le dépôt ou 2 s en hook de pré-commit, après profilage montrant
que le temps est dans l'analyse et non dans les entrées-sorties. À 0,2 s aujourd'hui, la condition n'est pas
remplie ; on ne l'implémente pas.

## Coût de la chaîne Rust

- Outils à installer : `rustup` (stable épinglée par `rust-toolchain.toml`), cible
  `wasm32-unknown-unknown`, `wasm-bindgen-cli` à la même version que la crate, éventuellement
  `wasm-opt`. `wasm-pack` n'est pas présent sur la machine de développement.
- CI : une tâche de plus (cache `~/.cargo`, `cargo test`, `cargo clippy -D warnings`, build WASM),
  plusieurs minutes de plus sur le chemin critique si non mise en cache.
- Publication : un artefact binaire dans le paquet npm (taille à mesurer, quelques dizaines de ko
  attendus pour `pp-color`), chaîne d'approvisionnement élargie (crates.io : `cargo deny`, `cargo audit`).
- Maintenance : deux langages pour une même logique tant que l'implémentation TypeScript sert de
  référence de parité ; contributeurs devant connaître Rust. Les règles du dépôt (120 lignes, pas de
  nombre magique) s'appliquent aussi au Rust (`clippy`, `rustfmt`).
- Contrainte : les fichiers des tâches d'agents ne doivent pas toucher `package-lock.json` ;
  l'ajout de la crate est donc une tâche de l'orchestrateur.

## Conséquences

- Gain certain et immédiat : typage et validation aux frontières (décision 1).
- Gain de Rust : incertain tant qu'aucune mesure ne l'établit ; il est conditionné par des seuils écrits.
- Réversible : chaque étape est une PR distincte, le TypeScript reste la référence jusqu'à la parité.
