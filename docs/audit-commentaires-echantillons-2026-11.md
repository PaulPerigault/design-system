# Échantillons de commentaires (2026-11-04)

Sortie de `npm run audit:comments -- --samples 30` (déterministe : un commentaire sur k). Chaque ligne :
`fichier:ligne [catégories : motif déclencheur] début du commentaire`. Les classes sont des
candidats lexicaux : Paul tranche. Voir `docs/audit-proprete-2026-11.md` §C pour les limites.

### supprimer

- .github/ISSUE_TEMPLATE/epique.yml:28 [decoratif]
- tools/links/external.mjs:12 [paraphrase] i.test(bare)) continue;

### reformuler

- .github/workflows/release.yml:71 [decision,reference: #130] Miroir facultatif sur GitHub Packages (#130, D-135) : après la publication npm seulement, jamais pour une PR.
- .github/workflows/skills-amont.yml:3 [decision,reference: #222] Contrôle mensuel, en lecture seule (D-116, #222) : compare le SHA relu de chaque skill tiers (tableau « Suivi
- apps/docs/e2e/devices.ts:1 [decision: L12] Matrice d'appareils de L12 (docs/benchmark/gap.md) : téléphones en portrait et paysage, tablette, ordinateurs,
- apps/docs/e2e/dialog.spec.ts:91 [decision: T12.05] Depuis T12.05, le menu mobile est un Dialog : chaque page porte le repli. Seul autre script permis : l'enregis
- apps/docs/e2e/matrix/visual.spec.ts:38 [decision: #127] Pages dont la hauteur suit le contenu (liste qui grandit à chaque ADR ou composant) : capture du viewport seul
- apps/docs/e2e/media.spec.ts:75 [decision,reference: T13.01] Depuis le gabarit de page (T13.01), l'exemple est sous la ligne de flottaison : il n'est plus candidat LCP. Le
- apps/docs/e2e/perf.spec.ts:7 [decision,reference: L12] Repères de L12 (docs/benchmark/gap.md), mesurés sur un téléphone d'entrée de gamme. Ce sont des mesures affich
- apps/docs/scripts/link-terms.mjs:7 [decision: #209] Termes liés au glossaire : la liste de l'audit (#209, M-8) et les outils (#211).
- apps/docs/src/components/DraftNotice.astro:2 [decision: Paul] Encart des textes rédigés à la première personne : brouillons que Paul réécrira à la main. Retirer l'encart (e
- apps/docs/src/components/examples/accent-hue-demo.astro:2 [decision: #121] Démonstration de `--pp-accent-hue` : la dérivation de `@paulperigault/dataviz` est calculée au build pour deux
- apps/docs/src/lib/a11y-statement.ts:20 [decision: Paul] Date d'établissement de la déclaration (AAAA-MM-JJ). Vide tant que Paul ne l'a pas renseignée.
- apps/docs/src/lib/a11y-statement.ts:22 [decision: Paul] Adresse de contact pour signaler un problème. Vide tant que Paul ne l'a pas renseignée.
- apps/docs/src/lib/a11y-statement.ts:28 [decision: Paul] Champs texte que Paul doit renseigner avant publication.
- apps/docs/src/lib/adr.ts:14 [decision: Paul] ADR relues et validées par Paul (2026-11-03) : plus de bandeau de brouillon.
- apps/docs/src/lib/glossary-dev.ts:3 [decision: #209] Termes de développement et de contrôle ajoutés par #209 (audit M-8).
- apps/docs/src/lib/glossary-outils.ts:3 [decision: #211] Termes d'outils et de publication ajoutés par #211 (règle FALC 11 : expliquer les mots difficiles).
- apps/docs/src/lib/legal.ts:6 [decision: Paul] Hébergeur (nom et adresse). Vide tant que Paul ne l'a pas renseigné.
- apps/docs/src/lib/legal.ts:8 [decision: Paul] Adresse de contact. Vide tant que Paul ne l'a pas renseignée.
- apps/docs/src/lib/legal.ts:12 [decision: Paul] Licence des contenus et de l'identité. Choix de Paul : option A, tous droits réservés.
- apps/docs/src/lib/llms.ts:1 [decision: T14.03] Texte de /llms.txt (llmstxt.org), logique pure ; cite les `.md` et `llms-full.txt` (T14.03).
- apps/docs/src/lib/seo.ts:22 [decision: Paul] Titre d'onglet : `Titre · Design system · Paul Perigault`.
- crates/pp-color-wasm/src/lib.rs:1 [decision,reference: issue #90] Liaison WebAssembly de `pp-color` (ADR-0006, décision 4, étape 8, issue #90). Crate mince : conversion des typ
- crates/pp-color/src/lib.rs:1 [decision,reference: issue #88] Couleur OKLCH, sRGB et gamut sRGB, en Rust pur (ADR-0006, décision 4, étape 7a, issue #88). Aucune dépendance
- crates/pp-data-wasm/src/lib.rs:1 [decision,reference: issue #99] Liaison WebAssembly de `pp-data` (ADR-0006, décision 4, étape V4b, issue #99). Crate mince : conversion des ty
- crates/pp-data/src/lib.rs:1 [decision,reference: issue #98] Agrégation, quantiles de type 7 et sous-échantillonnage LTTB, en Rust pur (ADR-0006, décision 4, étape V4a, is
- crates/pp-data/tests/vectors/mod.rs:6 [decision,reference: confirmé] Seuil de l'ADR-0007 sur les quantiles : écart relatif (confirmé en V4a, D-097).
- packages/astro/test/chart-text-size.test.ts:7 [decision: Paul] Plancher de taille du texte d'axe et de légende des graphiques (décision de Paul, 2026-10-29).
- packages/create/scripts/sync-versions-core.ts:1 [decision,reference: #236] Aligne les versions `@paulperigault/*` du gabarit sur celles des paquets du dépôt (#236, D-129). Pur : les ver
- packages/create/scripts/vendor-tokens.ts:1 [decision,reference: #151] Embarque la version compilée de `@paulperigault/tokens` dans `dist/vendor/tokens/` et réécrit les spécificateu
- packages/dataviz/src/domain/aggregate/keys.ts:10 [decision: 2026-10-28] Libellé du groupe d'un axe de dates : `2026-10-28`, `2026-10` ou `2026`, lu en UTC (aucun fuseau implicite). U

### garder-technique

- .github/workflows/ci.yml:151 [] Documentation construite puis testée dans Chromium : axe (WCAG 2.2 AA), 1.4.12, 2.5.8, mouvement réduit. Sur u
- apps/docs/e2e/inp.ts:13 [] INP (ms) : événement le plus long d'un clic sur le bouton du menu, avec sa décomposition.
- apps/docs/e2e/matrix/layout.spec.ts:6 [] Tolérance d'arrondi des largeurs (px).
- apps/docs/e2e/perf.spec.ts:13 [] Appareil : 360 × 800, tactile ; CPU ×4 plus lent ; « Slow 4G » (latence 150 ms, 1,6 Mbit/s).
- apps/docs/e2e/reflow.spec.ts:4 [] 1.4.10 : 320 px CSS de large, soit un zoom de 400 % sur 1280 px.
- apps/docs/playwright.config.ts:19 [] , use: { ...devices['Desktop Chrome'] } },
- apps/docs/src/components/PropsTable.astro:72 [] À 375 px, quatre colonnes ne tiennent pas : le tableau garde une largeur lisible (la mesure) et défile da
- apps/docs/src/pages/decisions/[id].astro:41 [] Tableaux Markdown rendus : ils tiennent dans la largeur à 320 px, les cellules se coupent.
- crates/pp-color/src/apca.rs:1 [] Contraste APCA, Lc signé. Mêmes définitions et mêmes constantes que `apcaLc` (`packages/tokens/src/lib/contras
- crates/pp-color/src/contrast.rs:55 [] Rapport de contraste WCAG 2, de 1 à 21, indépendant de l'ordre des couleurs. # Errors Voir [`relative_luminanc
- crates/pp-data/src/aggregate.rs:70 [] Agrège chaque série de `series` (une valeur par libellé de `labels`, `None` si manquante). Avec `GroupBy::Cate
- packages/astro/src/behaviors/invokers.ts:51 [] Clic sur un bouton d'invocation : la commande visée par `commandfor`. Le bouton reçoit le focus avant l'ouvert
- packages/astro/src/content/Card.astro:2 [] Card : carte riche en un seul bloc. Zéro JavaScript, aucun attribut `style` (CSP stricte). Avec `href`, un seu
- packages/astro/src/content/Table.astro:2 [] Table : tableau de données dans une région défilante nommée et focalisable (axe `scrollable-region-focusable`,
- packages/astro/src/data/BarChart.astro:2 [] BarChart : barres verticales ou horizontales, simples ou groupées (6 séries au plus), SVG statique généré au b
- packages/astro/src/data/LineChart.astro:2 [] LineChart : courbe d'une ou plusieurs séries, SVG statique généré au build. Zéro JavaScript, aucun attribut `s
- packages/astro/src/data/chart/bar-layout.ts:11 [] Largeur d'un caractère et hauteur d'une ligne de texte, en unités du viewBox (police des jetons).
- packages/astro/src/data/chart/bar-patterns.ts:7 [] Motif par rang de série, tracé dans la couleur du fond sur la couleur de la série : plein, diagonale montante,
- packages/astro/src/data/chart/sparkline-model.ts:6 [] Gabarit d'une sparkline, en unités du viewBox : la marge laisse la place des marqueurs.
- packages/astro/src/feedback/Alert.astro:2 [] Alert : message mis en avant, zéro JavaScript, ton par `data-tone` (CSP : aucun `style`). La couleur de statut
- packages/astro/src/forms/Input.astro:21 [] Jeton `autocomplete` (WCAG 1.3.5), par exemple `email` ou `name`.
- packages/astro/src/media/dominant.ts:19 [] Date de modification (ms) d'un fichier, `undefined` s'il est illisible.
- packages/astro/src/media/scrim.ts:37 [] Pire contraste WCAG 2 sur toute image possible. La luminance du composite croît avec chaque canal du fond : el
- packages/astro/test/BarChart.labels.test.ts:30 [] « 3 000 » : 5 caractères, soit 5 × 8 + 8 = 48 unités (72 avant).
- packages/color/src/contrast.ts:1 [] Contraste WCAG 2 et APCA, mêmes noms et signatures que `@paulperigault/tokens` (`lib/contrast.ts`). Une couleu
- packages/create/src/domain/hash.ts:4 [] SHA-256 hexadécimal des octets UTF-8, fins de ligne conservées.
- packages/dataviz/src/domain/limits.ts:30 [] `dataset.unit-mismatch` : deux unités différentes ne partagent pas un axe.
- packages/dataviz/src/domain/scale/time.ts:7 [] Domaine temporel en ms UTC : premier et dernier instant des dates ISO 8601 données.
- packages/dataviz/src/infrastructure/parse-axis.ts:38 [] Valide l'axe `x` : `category`, `time` (ISO 8601) ou `number`.
- packages/mcp/src/domain/contrast-pair.ts:1 [] Résolution d'une couleur (hexadécimal, oklch, jeton --pp-*) et rapport de contraste : ratio WCAG 2 (normatif,

### references D-xxx et ADR (⚖️)

- .github/workflows/ci.yml:11 [reference: D-029] Passage complet hebdomadaire (lundi 04:00 UTC) et déclenchement manuel avant la prod : e2e sur toute la matric
- .github/workflows/ci.yml:72 [reference: D-048] Même commande que Cloudflare Pages (docs/process/previews.md) : sans `dist/` préalable, elle doit se suffire à
- .github/workflows/ci.yml:89 [reference: D-114] Orthotypographie du texte rendu : mesure dans le résumé, bloquante règle par règle (D-114).
- .github/workflows/ci.yml:95 [reference: D-029] Décide si e2e tourne et sur quel périmètre. `render` : la PR touche le rendu (css, tokens, astro, apps, dépend
- .github/workflows/ci.yml:197 [reference: D-091] Paquets @paulperigault/color et @paulperigault/data (D-091 à D-094, D-100) : les .wasm sont compilés ici, jama
- .github/workflows/release.yml:71 [decision,reference: #130] Miroir facultatif sur GitHub Packages (#130, D-135) : après la publication npm seulement, jamais pour une PR.
- .github/workflows/visual.yml:3 [reference: D-141] Régression visuelle (gap.md n° 20) : captures pleine page de chaque page et de chaque thème, comparées aux réf
- apps/docs/e2e/media.spec.ts:75 [decision,reference: T13.01] Depuis le gabarit de page (T13.01), l'exemple est sous la ligne de flottaison : il n'est plus candidat LCP. Le
- apps/docs/e2e/perf.spec.ts:84 [reference: D-021] Affichée dans le rapport Playwright ; aucun seuil. Les runners GitHub (2 vCPU, rendu logiciel) ajoutent ~200 m
- apps/docs/src/components/DataAccess.astro:2 [reference: ADR-0007] Accessibilité et réglage de l'accent de la page Données : ADR-0007, décisions 3 et 4.
- apps/docs/src/styles/docs.css:79 [reference: D-132] Conteneur de page à la largeur de page ; `p.docs-prose` reste à la mesure (F-3, D-132).
- crates/pp-color/src/lib.rs:1 [decision,reference: issue #88] Couleur OKLCH, sRGB et gamut sRGB, en Rust pur (ADR-0006, décision 4, étape 7a, issue #88). Aucune dépendance
- crates/pp-color/tests/parity_contrast.rs:1 [reference: ADR-0006] Parité du contraste avec la référence TypeScript : rapport WCAG 2 identique à 1e-6 et arrondi à deux décimales
- crates/pp-color/tests/vectors/mod.rs:7 [reference: ADR-0006] Seuil de l'ADR-0006 sur les composantes ; appliqué aussi au rapport brut et à Lc.
- crates/pp-data/src/lib.rs:1 [decision,reference: issue #98] Agrégation, quantiles de type 7 et sous-échantillonnage LTTB, en Rust pur (ADR-0006, décision 4, étape V4a, is
- crates/pp-data/tests/parity.rs:1 [reference: ADR-0007] Parité avec la référence TypeScript (`packages/dataviz`), ADR-0007 décision 1 : quantiles à 1e-9 près en relat
- crates/pp-data/tests/vectors/mod.rs:6 [decision,reference: confirmé] Seuil de l'ADR-0007 sur les quantiles : écart relatif (confirmé en V4a, D-097).
- packages/astro/src/data/area-chart.css:1 [reference: ADR-0007] Aire (AreaChart) : fichier global, en plus de `chart-base.css`, `chart-series.css`, `line-chart.css` (contour
- packages/astro/src/data/chart/area-indices.ts:13 [reference: ADR-0007] Points par couche : 500 au plus (ADR-0007), le total partagé entre les couches.
- packages/astro/src/data/chart/frame.ts:30 [reference: ADR-0007] Plafond de points par série (ADR-0007) et budget de points par graphique (10 ko bruts).
- packages/color/test/parity.test.ts:1 [reference: ADR-0006] Parité du paquet construit (dist/ + .wasm) avec la référence TypeScript : mêmes vecteurs que crates/pp-color/t
- packages/create/scripts/vendor-tokens.ts:1 [decision,reference: #151] Embarque la version compilée de `@paulperigault/tokens` dans `dist/vendor/tokens/` et réécrit les spécificateu
- packages/data/src/aggregate.ts:54 [reference: ADR-0007] Le port `Aggregator` de `dataviz` implémenté par le `.wasm` (ADR-0007).
- packages/dataviz/src/application/ports.ts:16 [reference: D-098] Agrégation d'un jeu de données par catégorie ou par pas de temps (D-098). Implémentée d'abord en TypeScript (`
- packages/dataviz/src/domain/dataset.ts:1 [reference: ADR-0007] Contrat de données (ADR-0007) : colonnaire, versionné, valeurs manquantes à `null`.
- packages/dataviz/src/domain/limits.ts:13 [reference: ADR-0007] Plafond de catégories d'un graphique en barres (ADR-0007, D-042).
- packages/effect/src/build-input.ts:1 [reference: D-056] Entrées de build (`accentHue`, `fontStack`) validées avec `Schema`. Mêmes règles que le cœur (`tokens/customiz
- packages/effect/src/index.ts:1 [reference: ADR-0010] Option Effect-TS (ADR-0010) : hors du cœur, le cœur n'en dépend jamais.
- packages/effect/src/ports.ts:1 [reference: ADR-0006] Les ports du cœur, vus par Effect : des services de `Context`. Les interfaces TypeScript du cœur (`FileSystem`
- packages/effect/test/isolation.test.mjs:1 [reference: ADR-0006] Le cœur n'a aucune dépendance à Effect (ADR-0006 décision 2, ADR-0010) : manifestes et sources.
