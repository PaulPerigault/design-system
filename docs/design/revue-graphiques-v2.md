# Revue visuelle Encre des graphiques V2 (LineChart, BarChart, AreaChart, GaugeChart)

Date : 2026-10-29. Issue : #134. Skill : `.claude/skills/encre-design/SKILL.md`.
Corrections H1, H2 et M1 : D2 (#139, D-049), même jour ; les mesures « après » sont en tête de chaque point.

## Méthode

- Jeux : les démos des pages `components/line-chart`, `bar-chart`, `area-chart`, `gauge-chart`
  (3, 5, 5 et 4 graphiques : simple, multi-séries, trous, six couches, horizontal, jauge à zones,
  valeur hors intervalle, cercle borné).
- Rendu : serveur de développement d'`apps/docs`, Chromium, 375 et 800 px, clair et sombre
  (32 captures relues pour les cas représentatifs, mesures sur les 64 combinaisons).
- Contrastes : `contrastRatio` de `@paulperigault/tokens/contrast`, sur les valeurs OKLCH de
  `tokens.css`, contre `--pp-color-bg`.
- Taille de texte effective : `font-size` calculé multiplié par `largeur affichée / largeur du viewBox`.
- Aucun jeton, budget ni garde-fou modifié. La revue (#134) n'a corrigé aucun code ; D2 (#139) corrige H1, H2 et M1.

## Critique

Aucun point. Aucun contraste de tracé sous 3:1, aucun texte sous 4,5:1, aucune couleur seule
(motifs de trait, marqueurs, motifs de remplissage, étiquettes), aucun débordement horizontal
(`scrollWidth` = `clientWidth` aux deux largeurs, clair et sombre).

## À améliorer

### H1 (High) : texte des axes à 10,6 px sur mobile (Line, Bar, Area) : corrigé (D2, #139)

- **Après correction** : gabarit commun de 360 unités de large (420 avant), texte inchangé en
  `--pp-font-size--1` (14,4 unités) ; plancher de 12 px à 375 px décidé par Paul (14 px reste le plancher
  hors graphique). Tracé affiché à 309 px (écran de 375 px) : échelle 0,858, **12,4 px** (10,6 avant) ;
  à 800 px (tracé de 576 px) : 23,0 px (19,7 avant). Mesuré sur les 13 graphiques des trois pages, à deux
  largeurs, en deux thèmes (52 mesures) : texte minimal 12,36 px ; aucun texte hors du SVG ; `scrollWidth` = `clientWidth`
  (12 combinaisons page, largeur et thème) ; écart minimal entre graduations horizontales voisines
  5,6 px à 375 px (11,2 px avant : le plancher a coûté de l'espace, pas de chevauchement). La jauge
  (viewBox 300) n'a pas changé : 14,8 px au minimum. Poids : plus gros SVG des démos 6,5 ko (aire à six
  couches), au plus 8,9 ko et 55 nœuds au budget (6 séries de 500 points).
- Contrepartie : la zone de tracé passe de 328 à 268 unités ; les libellés de catégories des barres se
  tronquent plus tôt (voir M2).
- Mesure avant correction :
  `--pp-font-size--1` = 0,9 rem = 14,4 unités du viewBox (420 de large) ; affiché à 309 px
  (écran de 375 px), échelle 0,736 : **10,6 px**. À 800 px : 19,7 px. La jauge (viewBox 300, échelle 1,03)
  reste à 14,8 px au minimum.
- Écart : plancher de 14 px du skill (préférence à valider) ; 10,6 px est sous le plancher de lisibilité
  d'Atkinson (corps 18 px, ADR-0002).
- Correction proposée : un gabarit étroit (viewBox de 320 de large, graduations réduites) ou deux
  gabarits (ADR-0007, point ouvert 3 : « un gabarit unique contre deux »). Touche la géométrie de
  `dataviz` et les étiquettes : trop large pour quelques lignes. Un agrandissement en CSS seul fait
  chevaucher les libellés de l'axe des dates (environ 18 px d'écart relevé sur capture entre « janv. 2025 » et « avr. 2025 »).
- Décision de Paul requise avant de coder.

### H2 (High) : valeurs écrites dans les barres, lisibles par leur seul liseré (BarChart) : corrigé (D2, #139)

- **Après correction** : `inkOn` (`@paulperigault/dataviz`) choisit `--pp-color-fg` ou `--pp-color-bg` pour
  chaque série et chaque thème, depuis `tokens.json`. Texte contre la barre, clair / sombre : série 1 bg 6,93 /
  bg 8,94 ; série 2 fg 5,00 / fg 4,78 ; série 3 bg 17,66 / bg 14,19 ; série 4 fg 5,48 / fg 4,97 ; série 5
  bg 8,23 / bg 7,12 ; série 6 fg 4,86 / bg 4,81. **Minimum 4,78:1** (sept cas sous 4,5 avant, jusqu'à
  1,05). Un test refait le calcul pour les douze couples. Les valeurs qui ne tiennent pas dans la barre
  restent à son extrémité, en `--pp-color-fg` (16,79 / 15,38) avec liseré du fond.
- **Liseré** : gardé, mais passé à la couleur de la série pour une valeur sur barre. Raison : le motif de
  remplissage trace ses traits dans la couleur du fond ; un texte `bg` posé sur ces traits s'y fondrait
  (contraste 1:1 aux croisements), et un liseré du fond autour d'un texte `bg` ne ferait qu'épaissir les
  chiffres. Un liseré de la série isole les chiffres des traits sur chaque pixel voisin du glyphe, avec
  le même contraste que le texte. Vérifié sur capture à 375 px, clair et sombre (six séries, barres verticales : diagonale, points,
  lignes, quadrillage) ; couleurs calculées relevées aussi à 800 px. En contraste forcé : texte `Canvas`, liseré `CanvasText`.
- Mesure avant correction :
  texte `--pp-color-fg` posé sur la couleur de série, clair / sombre : série 1 2,42 / 1,72 ;
  série 3 1,05 / 1,08 ; série 5 2,04 / 2,16 ; série 6 4,86 / 3,20 ; séries 2 et 4 de 4,78 à 5,48.
  Sous 4,5:1 pour sept des douze cas. La lisibilité vient d'un liseré de la couleur du fond de
  2 `--pp-size-rule` (1 px visible hors du glyphe).
- Vu sur la capture 800 px, clair : « 3400 », « 2600 », « 1900 » restent lisibles mais les chiffres
  ont un bord flou.
- Correction proposée : texte en `--pp-color-bg` sur les séries 1, 3, 5 (6,93 à 17,66 clair ; 7,12 à
  14,19 sombre), en `--pp-color-fg` sur les séries 2, 4, 6, sauf la série 6 en sombre (bg, 4,81).
  Demande de porter `series` et `inside` dans `ValueLabel` (`bar-values.ts`), `BarLabels.astro` et
  trois règles CSS, et de revoir le liseré sur les motifs de remplissage. Non faite ici : c'est un
  changement de rendu (références Visuel de `components/bar-chart` à régénérer sur Linux) à relire
  à l'œil sur les six séries, clair et sombre.

### M1 (Medium) : contour d'aire tracé sur le chemin fermé (AreaChart) : corrigé (D2, #139)

- **Après correction** : chaque couche a un fond fermé (sous la grille) et un contour qui suit la seule courbe
  supérieure (`AreaGeometry.top`). Les deux chemins s'écrivent en coordonnées relatives à une décimale
  (`relativeCurve`), erreur d'arrondi sans accumulation. Poids, 6 séries de 500 points (LTTB à 250) :
  8 598 o avant (viewBox de 360 déjà appliqué), **8 891 o** après (budget 10 000 o) ; 4 séries 7 273 puis 7 767 o ; nœuds 62 puis 55. Un
  second chemin en coordonnées absolues à deux décimales donnait 10 237 o (4 séries) et 11 397 o (6 séries) :
  hors budget, donc écarté. Constaté sur capture (deux couches, 800 px) : plus de trait sur la base ni
  sur les côtés ; trou de données : un contour par segment continu.
- Constat avant correction :
  `AreaChart.astro` référence le même `<path>` fermé pour le fond et pour le contour
  (`<use class="…__line">`). Le trait de la série se dessine donc aussi sur la base et sur les côtés
  gauche et droit (visible sur les captures « deux couches » : pointillés orange sur le bord).
- Écart : ADR-0007, décision 5 : « aire à 12 % d'opacité au plus, **trait au-dessus** ».
- Contexte : un second chemin ouvert par couche a été écarté en D-044 (dépasse 10 ko dès 4 séries).
  Ce n'est donc pas une correction à quelques lignes : elle rouvre un choix de budget.
- Pistes : (a) accepter l'écart et le dire dans la page du composant ; (b) un `clip-path` qui coupe le
  trait sur la base (ne retire pas les côtés) ; (c) un chemin ouvert seulement au-delà d'un nombre
  de points à mesurer. Décision de Paul avant tout changement de budget (⚖️).

### M2 (Medium) : libellé de catégorie tronqué à 800 px (BarChart) : traité (D-053, #143), limite documentée

- Après H1 : à cinq catégories, « Accueil », « Journal » et « Contact » (7 caractères) se tronquent
  (« Accue… ») ; la marge d'un caractère entre libellés voisins a été retirée pour que « France » tienne
  encore. Le calcul garde 8 unités par caractère (mesuré : 6,4 à 8,0 pour les mots du jeu), donc deux
  libellés voisins ne se touchent pas ; le texte complet reste dans `<title>` et le tableau lié.
- Constat initial :
- Mesure : « Références » devient « Référe… » dans le jeu à 5 catégories (`<title>` complet présent,
  tableau lié complet).
- Correction proposée : passer à deux lignes (le modèle gère déjà `lines`) avant de tronquer.

### L1 (Low) : grille et filets

- `--pp-color-line` contre le fond : 1,35:1 (clair) et 1,54:1 (sombre). Décoratif, ne porte aucune
  donnée, hors du champ de 1.4.11 ; à conserver ainsi. Les axes utilisent `--pp-color-muted`
  (7,78:1 et 9,34:1).

## Ce qui fonctionne

- **Couleurs de série** contre le fond, clair / sombre : 6,93 / 3,36 / 17,66 / 3,07 / 8,23 / 3,45 et
  8,94 / 3,22 / 14,19 / 3,10 / 7,12 / 4,81. Minimum 3,07:1 : seuil de 3:1 tenu pour les six rangs
  dans les deux thèmes (marge faible sur les rangs 2, 4 et 6 : 0,07 à 0,45).
- **Jauge** : zones en `--pp-color-status-*` (5,87 à 10,22:1), chaque zone avec motif (uni, hachures,
  points), libellé et plage écrits dans la légende ; valeur 36 px, « 72 % » et état écrit (« Vigilance »).
  Exception d'accent coloré par seuils conforme à la réponse de Paul. Libellés à 14,8 px au minimum
  à 375 px, 18,4 px à 800 px.
- **Texte** : `--pp-color-muted` 7,78 / 9,34, `--pp-color-fg` 16,79 / 15,38 ; chiffres tabulaires.
- **Traits** : courbes à 2 `--pp-size-rule`, grille à 1, aucun dégradé, ombre, flou, emoji,
  animation ; coins droits sur les barres ; aire de fond mêlée au fond de page (12 %).
- **Sobriété** : aucune décoration, étiquettes directes, légende à marqueur + libellé, tableau lié
  (`Données du graphique`) sous chaque figure.
- **Police** : Atkinson Hyperlegible Next dans `--pp-font-family-sans` (vérifié dans `tokens.css`).

## À faire (aucune issue ouverte)

1. ~~H1~~, ~~H2~~, ~~M1~~ : corrigés par D2 (#139, D-049).
2. M2 : libellés de catégories des barres (aggravé par H1) : retour à la ligne avant troncature, ou
   plus de place pour les barres verticales ; un mot seul de plus de 6 caractères ne se coupe pas.
3. Graduations temporelles : le choix du pas ignore la largeur des libellés (écart minimal 5,6 px à
   375 px) ; un pas tenant compte de la largeur évite le chevauchement sur d'autres jeux.
4. Marge de contraste des rangs 2, 4 et 6 (3,07 à 3,45:1 en clair) : à surveiller si la teinte
   d'accent change (`--pp-accent-hue`, #121) ; le test de dérivation de `dataviz` le couvre.
5. Ajouter au skill une mesure automatisée (script `contrastRatio` sur les jetons `--pp-chart-*`) si la
   revue se répète.
