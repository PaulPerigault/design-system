# ADR-0007 — Visualisation de données : contrat, rendu SVG, accessibilité, palettes

- Statut : proposé (2026-10-28). Documentation seulement : aucun composant n'est codé par cet ADR.
- Lié : ADR-0002, ADR-0006, D-030, D-038, issue #93. Cadre le lot analyse V2a à V5 (#94 à #100).

## Contexte

Paul veut afficher de la BI sur ses sites : des visuels de données propres, une direction
artistique Encre, zéro JavaScript par défaut, une accessibilité par conception, une couleur
d'accent et une typographie modifiables par une variable pour un projet externe, et du Rust
seulement pour le calcul (`pp-data`), sans que le rendu en dépende. Réutilisables : `Stat`,
`Table`, `Progress`, `Skeleton`, `EmptyState`, `Alert`, `Figure` ; jetons `--pp-color-*`,
`--pp-font-*`, `--pp-space-*`, `--pp-size-rule` ; bibliothèques `color` et `contrast` de `tokens`.

## Décision 1 : contrat de données

- **Format** : un `Dataset` colonnaire, versionné (`schema: 1`) : un axe `x` (`category`, `time` ou
  `number`) et des `series` (`id`, `label`, `unit`, `values`). Colonnaire parce que c'est le format
  naturel d'un `Float64Array` (WebAssembly) et le plus court en JSON.
- **Valeurs manquantes** : `null`, jamais `0` ni `NaN` (aucun `NaN` ni infini ne franchit la
  frontière). Une valeur manquante rompt la courbe, laisse un vide dans les barres et s'annonce dans
  le tableau (« donnée manquante »).
- **Unités** : une unité par série (`€`, `%`, `ms`…), jamais fondue dans la valeur ; deux séries
  d'unités différentes ne partagent pas un axe (erreur `unit-mismatch`, ou axes séparés demandés).
- **Dates** : ISO 8601 (`2026-10-28`, `2026-10`, `2026-10-28T09:00:00Z`), lues en UTC, sans
  fuseau implicite ; pas de `Date` locale dans le domaine.
- **Locale fr** (par `Intl`, locale `fr` par défaut, propriété `locale` pour changer) : séparateur
  décimal virgule, groupes de milliers par espace fine insécable (U+202F), unité précédée d'une
  espace insécable, dates en toutes lettres dans les libellés et ISO dans les attributs `datetime`.
  Convention typographique, non une preuve.
- **Frontière** : `infrastructure/parse-dataset.ts` valide toute entrée (JSON, fichier, sortie de
  `pp-data`) et produit un `Dataset` du domaine ou une `ChartError`. Le domaine ne reçoit jamais de
  donnée non validée (ADR-0006, décision 1).
- **Erreurs typées** (`errors.ts`, union fermée à champ `code`) : `dataset.empty`,
  `dataset.length-mismatch`, `dataset.non-finite`, `dataset.duplicate-id`, `dataset.bad-date`,
  `dataset.unit-mismatch`, `dataset.too-many-points`, `chart.too-many-series`, `bar.too-many-categories`, `stack.negative-value`, `gauge.bad-range`, `gauge.bad-thresholds`. Type `Result` maison,
  TypeScript strict (ADR-0005), aucun `any`.
- **Compatibilité Rust/WebAssembly** : `pp-data` consomme et produit le même `Dataset` (`f64` plus
  masque des manquants). Port `Aggregator` : `(Dataset, Spec) → Result<Dataset, ChartError>`,
  implémenté d'abord en TypeScript (référence), plus tard par l'adaptateur WebAssembly. Définitions
  figées pour que les deux s'accordent : quantiles de type 7 (Hyndman et Fan, 1996, défaut de R et
  NumPy), sous-échantillonnage LTTB (Steinarsson, 2013, thèse, université d'Islande). Parité attendue
  à 1e-9 près en relatif (seuil à confirmer en V4a). Le WebAssembly s'exécute au build (Node), jamais
  chez le lecteur : le rendu n'en dépend en aucun cas.

## Décision 2 : rendu

- **SVG statique** produit au build par des composants Astro, zéro JS par défaut. Géométrie
  calculée par le domaine (`dataviz`), le composant ne fait que poser des éléments.
- **Aucune couleur brute, aucun attribut `style`** : couleurs par classes et attributs `data-series`
  mappés en CSS vers `--pp-*` ; géométrie en attributs SVG (`x`, `y`, `d`), polices et traits en CSS.
  Un test parcourt le SVG produit (pas de `#…`, `rgb(`, `style=`).
- **Amélioration progressive** (rien n'est requis pour lire la donnée) : survol et focus par CSS
  (`:hover`, `:focus-visible`) ; filtres de séries par cases à cocher et `:has()`, sans script ;
  infobulle native `<title>` par point. Un îlot JS facultatif (`behaviors`) n'est admis que s'il est
  nécessaire (grands jeux de données) et laisse le repli CSS intact.
- **Types du premier jalon** : courbe ; barres (simples et groupées, verticales ou horizontales) ;
  aire (simple, empilée de 6 séries au plus, D-044) ; jauge (arc, D-044) ; sparkline ; KPI (valeur, unité, variation) ;
  tableau. La jauge est un arc, demi-cercle ou cercle complet, à zones par seuils (D-044) ; le bullet graph (Few, 2006) reste une option pour V3.
- **Hors périmètre du jalon** : camembert et anneau (angles et aires sont lus moins bien que des
  longueurs : Cleveland et McGill, 1984), 3D, radar, treemap, cartes, nuage de points, histogramme
  et boîte à moustaches (après `pp-data`), barres empilées, temps réel, zoom et défilement,
  export d'image.
- **Budgets** (conventions, mesurées en CI à partir de V2a) : au plus 400 nœuds SVG et 10 ko bruts
  par graphique (tableau lié exclu) ; sparkline ≤ 1,5 ko ; 6 séries au plus ; barres ≤ 40
  catégories (D-042 ; au-delà : courbe, ou tri et regroupement « autres », ou tableau) ; tableau lié ≤ 200 lignes
  (au-delà : en-tête et pagination par le composant `Table`).
- **Sous-échantillonnage** : courbes et aires plafonnées à 500 points par série (environ un point
  par pixel de la largeur de référence) par LTTB au build ; le tableau lié garde la donnée complète
  (ou l'agrégat annoncé comme tel). Barres : jamais échantillonnées, agrégées.
- **Mise en page** : un seul gabarit SVG (`viewBox`, `width: 100%`) ; graduations choisies pour la
  largeur minimale (320 px) ; textes en `font-size` des jetons, traits en `vector-effect:
non-scaling-stroke`. Étiquettes directes plutôt que légende.

## Décision 3 : accessibilité (WCAG 2.2 AA)

- **Alternative textuelle** : `<figure>` + `<figcaption>` (titre et résumé factuel produit depuis la
  donnée : étendue, minimum, maximum, tendance chiffrée) ; `<svg role="img" aria-labelledby>`
  renvoyant à `<title>` et `<desc>` ; tableau de données lié (`<table>` avec `<th scope>`),
  référencé dans `<desc>`. Une valeur manquante est dite, pas omise.
- **Ordre de lecture** = ordre du DOM : titre, résumé, graphique, tableau (voie clavier par défaut).
- **Clavier** (seulement si interactif) : au plus 50 points focalisables (`tabindex="0"`,
  `aria-label` « libellé, valeur, unité »), au-delà : aller au tableau. Focus visible par jetons
  (`--pp-size-focus-*`), cibles ≥ `--pp-size-target-min` (WCAG 2.5.8) pour tout contrôle.
- **Contraste** : tracés, barres et marques ≥ 3:1 contre le fond (1.4.11) ; texte ≥ 4,5:1 (1.4.3),
  en `--pp-color-fg` ou `--pp-color-muted`, jamais en couleur de série ; deux barres voisines sont
  séparées par un espace. Une valeur posée sur une barre prend `fg` ou `bg`, selon la série et le
  thème, pour atteindre 4,5:1 contre la barre (D-049).
- **Jamais la couleur seule** (1.4.1) : étiquette directe en bout de courbe ; chaque série d'indice
  `i` reçoit aussi un motif de trait (continu, tirets, points…) et un marqueur ; légende = marqueur
  plus libellé ; variation d'un KPI dite en mots (« hausse de 4,2 % ») avec signe, la couleur de
  `--pp-color-status-*` n'étant qu'un renfort.
- **Mouvement réduit** : aucune animation par défaut, toute transition sous
  `prefers-reduced-motion: no-preference`. **Contraste forcé** (`forced-colors: active`) : tracés en
  `CanvasText`, séries distinguées par motifs de trait et marqueurs.
- **Impression** : thème clair forcé, tableau lié visible (mécanisme à valider en V2a : `details`
  fermé masque son contenu), motifs conservés pour le noir et blanc.

## Décision 4 : palettes

- **Dérivation** : par une fonction pure de `dataviz` à partir de la teinte d'accent (OKLCH) et des
  jetons neutres, jamais par une couleur codée en dur. Sortie : jetons `--pp-chart-*` générés dans
  `tokens.css` (jeux clair et sombre, `light-dark()`), choisis plutôt que les couleurs relatives CSS
  parce qu'une valeur calculée à l'exécution ne se vérifie pas en CI.
- **Catégorielle** (6 couleurs) : la teinte d'accent en tête, puis des écarts de teinte et une
  alternance de deux niveaux de clarté, pour que deux couleurs voisines diffèrent aussi en
  luminance (ce qui survit aux daltonismes). Les écarts sont fixés et calibrés en V2a sous la
  contrainte ci-dessous. _Réalisé en V2-0 (D-039) :_ la catégorielle n'est pas une table d'écarts
  fixes mais un échantillonnage du point le plus éloigné, par teinte, qui atteint ΔE00 ≥ 15 sur 12
  teintes et deux thèmes ; une table fixe plafonnait vers 8 à 9 en pire cas. Au-delà de 6 séries : regrouper, ne pas étirer la palette.
- **Séquentielle** : une teinte (l'accent), 7 pas de clarté monotone, contrôlés en luminance
  croissante (ColorBrewer, Brewer, 2003, pour le principe ; pas de palette empruntée).
- **Divergente** : deux extrémités (l'accent et sa teinte opposée) de clarté décroissante vers un
  centre neutre (`--pp-color-line`) ; l'axe bleu-orangé est le plus sûr pour la protanopie et la
  deutéranopie.
- **Vérification daltonisme** : simulation de la protanopie, de la deutéranopie et de la
  tritanopie par les matrices de Machado, Oliveira et Fernandes (2009, IEEE TVCG 15(6), gravité 1,0),
  appliquées en RGB linéaire ; écart CIEDE2000 (CIE 142-2001 ; implémentation de Sharma, Wu et
  Dalal, 2005) entre chaque paire de couleurs simulées. **Critère : ΔE00 ≥ 10 pour toute paire de
  la catégorielle, ≥ 3 entre pas voisins de la séquentielle** (seuils de convention, à confirmer
  par la calibration de V2a ; les marqueurs et motifs restent exigés en plus, décision 3). Test
  Vitest sur l'accent par défaut et sur 12 teintes d'accent espacées de 30°, thèmes clair et sombre.
- **Contrat d'une variable** (réalisation : point ouvert 1) : un projet externe fournit une teinte
  d'accent ; `create` (ou le build de `tokens`) appelle la dérivation, qui régénère accent,
  catégorielle, séquentielle, divergente, `--pp-color-on-accent`, et refuse (erreur typée) une
  teinte dont la dérivation échoue au contrôle. Typographie : une variable de pile de police dont
  dérivent `--pp-font-family-sans` et `--pp-font-family-mono` ; axes et libellés en
  `--pp-font-size--1`, chiffres en `font-variant-numeric: tabular-nums`.

## Décision 5 : direction artistique (identité Encre)

- **Rapport données/encre** (Tufte, 1983) : tout élément qui ne porte pas de donnée disparaît :
  pas de cadre, pas de fond de tracé, pas de grille verticale, pas d'ombre, de dégradé ni de flou
  (interdits d'AGENTS.md).
- **Annotations** : texte direct, 3 au plus, trait de rappel fin. **Traits** : courbes à 2 `--pp-size-rule` (jetons de trait de graphique à créer en V2a), grille
  horizontale à 1 `--pp-size-rule` en `--pp-color-line`, ligne de base pleine ; barres pleines à
  coins droits ; aire à 12 % d'opacité de la couleur de série au plus, trait au-dessus.
- **Axes** : barres à partir de zéro ; courbes avec ou sans zéro, dit dans la description ;
  graduations « rondes » (Heckbert, 1990), 5 au plus.
- **États** : vide = `EmptyState` ; erreur = erreur typée qui fait échouer le build par défaut, ou
  `Alert` plus tableau de repli si la donnée est valide et le rendu impossible ; chargement =
  `Skeleton`, seulement pour un îlot interactif (un graphique statique n'a pas d'état de chargement).

## Décision 6 : architecture

- **Nouveau paquet `@paulperigault/dataviz`** (`packages/dataviz`), TypeScript pur, sans dépendance
  de rendu, dépendant de `tokens` (couleur, contraste). Sens : `tokens ← dataviz ← astro` ; `css` n'en
  dépend pas. Un projet non Astro réutilise le domaine ; ligne à ajouter au tableau d'AGENTS.md.
- Structure (ADR-0006) : `domain/` (contrat, échelles, graduations, géométrie, formatage fr,
  palettes, simulation du daltonisme, LTTB de référence) ; `application/` (`buildChartModel` :
  `Dataset` + options → modèle géométrique ; `ports.ts` : `Aggregator`, `Formatter`) ;
  `infrastructure/` (`parse-dataset`, adaptateur `Intl`) ; `errors.ts` ; `index.ts`.
- **Composants** : `packages/astro/src/data/` (`LineChart`, `BarChart`, `AreaChart`, `Gauge`,
  `Sparkline`, `Kpi`, `DataTable`), sans couches (ADR-0006, décision 3), ≤ 120 lignes ; ils
  reçoivent un modèle, ne calculent rien. Polymorphisme `as` fermé (`figure | div | section`).
- **Tests** : calculs purs sans double (échelles, graduations, géométrie, formatage, simulation :
  valeurs de référence publiées), propriétés à graine fixe (sans dépendance) ; rendu
  par instantané limité à un par composant ; budgets (nœuds, octets) ; absence de couleur brute et de
  `style` ; axe en e2e (2 thèmes, 2 fenêtres) ; contrôle du daltonisme. `guards` vérifie la règle
  de dépendance.

## Décision 7 : découpage

| Issue   | Ce que l'ADR impose                                                                          |
| ------- | -------------------------------------------------------------------------------------------- |
| #94 V2a | `dataviz` (contrat, échelles, palettes) ; `LineChart`, `BarChart` ; budgets ; test daltonien |
| #95 V2b | `AreaChart`, `GaugeChart` (arc) sur le même contrat ; aire empilée ≤ 6 séries (D-044)        |
| #96 V3a | `Kpi` (variation dite en mots), `Sparkline` ≤ 1,5 ko, tendance annoncée                      |
| #97 V3b | `DataTable`, légende marqueur plus libellé, filtres `:has()` sans JS, cibles ≥ minimum       |
| #98 V4a | `pp-data` : même `Dataset` en `f64`, quantiles de type 7, LTTB, aucun `panic`                |
| #99 V4b | adaptateur WebAssembly du port `Aggregator` ; parité 1e-9 ; le rendu s'en passe              |
| #100 V5 | page assemblant tout, soumise aux budgets, impression, contraste forcé, mouvement réduit     |

**Critères d'acceptation à corriger** (issues non modifiées ; ajouts proposés) :

- **Nouvelle issue à créer avant #94** : « [V2-0] paquet dataviz : contrat, échelles, formatage,
  palettes » (le socle dépasse la taille `page` de #94) ; #94 en serait bloquée.
- #94 : « `Dataset` validé à la frontière, erreurs typées » ; « aucune couleur brute ni `style` dans
  le SVG (test) » ; « test daltonien (3 types) sur l'accent par défaut et 12 teintes » ; « budget
  de 400 nœuds et 10 ko » ; « titre, description et tableau liés » ; « motifs de trait et marqueurs » ;
  « formats fr ».
- #95 : « jauge en arc à zones par seuils » ; « aire empilée ≤ 6 séries » ; mêmes critères que #94.
- #96 : « variation dite en mots » ; « sparkline ≤ 1,5 ko ». #97 : « `<th scope>` » ; « filtres sans
  JavaScript » ; « tableau complet affiché sans filtre ».
- #98 : remplacer « `cargo clippy` sans avertissement » par les critères d'ADR-0006 ; ajouter
  « quantiles de type 7 et LTTB conformes à la référence TypeScript » ; la dépendance à #93 reste.
- #99 : ajouter « parité 1e-9 en CI », « temps de chargement mesuré », « build sans Rust », « le
  rendu fonctionne sans le paquet ». #100 : ajouter « impression », « contraste forcé »,
  « mouvement réduit », « budget de poids de la page ». #93 : la preuve chiffrée des palettes vient
  du test de #94.

## Points ouverts et risques

1. ~~Noms et lieu du contrat d'une variable (teinte d'accent, pile de police)~~ : fermé le
   2026-10-28 (D-039). Entrées `--pp-accent-hue` (teinte OKLCH en degrés ; clarté et chroma fixés par
   le système : clair `oklch(47% 0.19 h)`, sombre `oklch(78% 0.1 h)`) et `--pp-font-stack` (pile du
   texte, dont dérive `--pp-font-family-sans` ; `--pp-font-family-mono` à part). Sorties inchangées :
   `--pp-color-accent`, `--pp-chart-*`, `--pp-font-family-*`. Les neutres d'Encre (teinte 270.7) ne
   suivent pas l'accent : choix explicite à trancher au branchement dans `tokens` et `create`. La
   dérivation est livrée par `@paulperigault/dataviz` (V2-0, #120) ; le branchement est l'issue #121.
2. Seuils ΔE00 (10 et 3) : conventions ; la calibration de V2a peut les ajuster, sans les affaiblir
   sans écrit. Risque : 6 couleurs tritan-sûres sur fond sombre et clair sont peut-être
   inatteignables ; repli : 5 séries au plus, motifs de trait plus visibles.
3. ~~Un gabarit SVG unique contre deux (compact et large)~~ : fermé le 2026-10-29 (D-049). Un seul
   gabarit, de 360 unités de large (420 avant) : décision de Paul, plancher de 12 px à 375 px pour
   le texte d'axe et de légende des graphiques ; 14 px reste le plancher du texte hors graphique.
   Mesure à 375 px (tracé affiché à 309 px) : 10,6 px avant, 12,4 px après ; 19,7 puis 23,0 px à
   800 px. Les graduations ne se chevauchent pas (écart minimal de 5,6 px). Contrepartie : les
   libellés de catégories des barres se tronquent plus tôt (la zone de tracé passe de 328 à 268
   unités), à traiter par des libellés sur deux lignes ou une aération (revue des graphiques V2, M2).
   Traité le 2026-10-29 (D-053, #143) : la colonne des graduations des barres verticales ne garde
   que la place de ses chiffres (72 → 48 unités pour « 3 000 »), l'unité passe en haut à gauche ;
   la zone de tracé passe de 268 à 292 unités, cinq libellés de sept caractères tiennent. Limite :
   un libellé plus long que sa bande reste tronqué, texte complet dans `<title>` et le tableau.
   Reste ouvert : l'impression du tableau dans un `details` fermé.
4. Risque de poids : un paquet de plus et des SVG verbeux ; parade : budgets bloquants en CI et
   arrêt du lot si un graphique dépasse sans justification écrite.
