# Audit du site de documentation (2026-11-02)

Audit en lecture seule de `apps/docs` après la refonte (#123, ADR-0008, D-108). Aucune page ni
aucun texte n'est modifié. Issue : #206. Il suit l'audit du 2026-10-29 (`docs/design/audit-site.md`)
et ne le remplace pas. Mesures sur le build local du 2026-11-02 (`apps/docs/dist`, 80 pages, servi en
local). Les scripts de mesure sont locaux (`tmp/audit/`, non commités) ; les chiffres sont recomptables
avec les commandes de la section « Méthode ».

## Résumé

- Un défaut Critique : les titres h1 à h3 s'affichent comme le corps du texte (18 px, graisse 400).
- Cinq défauts Élevés : mots collés autour du code, backticks visibles, tableaux illisibles à 375 px,
  orthotypographie absente, pas de page 404 ; plus onze liens externes en 404.
- Ce qui tient : 0 violation axe sur 320 passes, aucun débordement horizontal, aucune cible
  sous 24 px hors liens en ligne, 5 liens internes cassés sur 7 898.

## Méthode et niveaux de preuve

- Liens : parcours des 80 pages de `dist/` (`href`, `src`, `srcset`, ancres) ; HEAD sur chaque lien
  externe, 700 ms entre deux requêtes, un seul essai. Preuve : mesure.
- Texte : extraction des nœuds de texte au rendu (Chromium, Playwright), hors `code`, `pre`, `kbd`,
  `script`, `style`. Les règles sont des expressions régulières : chaque famille a été relue sur
  ses exemples ; les faux positifs sont indiqués. Preuve : mesure ; la règle typographique : [À VÉRIFIER].
- UX/UI : 80 pages × 375 et 1280 px × clair et sombre = 320 passes avec axe-core (WCAG 2.0 à 2.2 A et
  AA, bonnes pratiques) ; captures pleine page de 21 pages types dans `tmp/audit/shots/` (non commité).
- Voix : grille d'`encre-voix`. Accessibilité cognitive : section « Sources ».
- Niveaux : mesure (reproductible ici), norme (W3C), convention (documentation d'éditeur),
  préférence (choix du dépôt), [À VÉRIFIER] (source non lue).

## Chiffres

| Mesure                                                           | Valeur                                  |
| ---------------------------------------------------------------- | --------------------------------------- |
| Pages construites, entrées du sitemap                            | 80, 80 (aucun écart)                    |
| Références internes (`href`, `src`) parcourues                   | 7 898                                   |
| Liens internes cassés                                            | 5 (4 pages)                             |
| Ancres manquantes                                                | 11 occurrences (2 pages)                |
| Liens externes distincts, HTTP 200 / 301-302 / 404               | 59, 46 / 2 / 11                         |
| 404 au total (distincts) / occurrences                           | 16 / 20                                 |
| Espace sécable avant « : » (hors code)                           | 1 161 (80 pages)                        |
| Espace sécable avant « ; », « ? », « ! »                         | 421 (58 pages)                          |
| Guillemets « » avec espace sécable                               | 212 paires (41 pages)                   |
| Espace sécable avant une unité / avant « % » / dans un millier   | 131 (32) / 11 (8) / 69 (15)             |
| Apostrophe droite hors SVG / dans les `desc` SVG / dans un titre | 149 (46) / 24 (5) / 2                   |
| Backticks visibles dans le texte                                 | 322 (43 pages)                          |
| Mots collés à un `code` ou un lien                               | 114 (80 pages, dont 80 en pied de page) |
| Tableaux aux en-têtes sous 56 px à 375 px                        | 66 en-têtes (57 pages)                  |
| Violations axe (320 passes)                                      | 0                                       |
| Pages avec `DraftNotice` (« Brouillon à relire par Paul »)       | 14                                      |

Faux positifs écartés : `: ` collé (29) et `;?!` collé (8) viennent de code écrit en texte
(`prefers-reduced-motion: reduce`, `{ label, href? }`) ; « % » collé (126) vient de `oklch(47% …)`.
Ils ne sont pas comptés comme défauts d'espacement.

## Constats

### Critique

| #   | Constat                                                                                                                                                           | Page, preuve                                                                                                                                              | Correction proposée                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-1 | Aucune hiérarchie visuelle : h1, h2 et h3 calculent 18 px, graisse 400, comme le corps. Un lecteur ne repère ni la page ni ses sections. Le balisage est correct. | `/`, `/utiliser/`, `/preuves/`, `/components/button/` : `getComputedStyle` = 18 px / 400 ; reset `font-size: inherit` dans `DocsLayout.*.css` ; captures. | Appliquer l'échelle de jetons existante (`--pp-font-size-1` à `-4`, graisses `-semibold`) aux titres de `main` dans la mise en page de la doc, sans nouveau jeton. |

### Élevé

| #   | Constat                                                                                                                                             | Page, preuve                                                                                                                                   | Correction proposée                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| E-1 | Onze liens externes en 404 : `www.w3.org/WCAG22/Understanding/…` au lieu de `/WAI/WCAG22/Understanding/…` (15 occurrences, 5 pages).                | `/components/button/` (4), `input/` (4), `field/` (4), `center/` (1), `switcher/` (2) ; HEAD 404 le 2026-11-02 ; sources `components/*.astro`. | Ajouter `/WAI/` aux 11 URL.                                                                                    |
| E-2 | Mots collés autour du code et des liens : « dansapps/docs/… », « etnpx », « Mon siteet », « Auteur :Paul Perigault » (80 pages, pied de page).      | 114 cas ; `DocsLayout.astro:68` (pied) ; `index.astro:95` ; `/utiliser/` (6), `/donnees/` (12), `/accessibilite/` (4), `/` (4) ; captures.     | Corriger les espaces perdues à la mise en forme des sources `.astro` ; contrôle automatique (issue [CI]).      |
| E-3 | Backticks Markdown visibles dans le texte : « `{ id, title, body }` », « `polite` ».                                                                | 322 cas, 43 pages, tous dans les tableaux de propriétés (`PropsTable.astro`, JSDoc de `packages/astro`) ; `/components/alert/`, `area-chart/`. | Rendre les segments entre backticks en `<code>` dans `PropsTable`.                                             |
| E-4 | Tableaux de propriétés illisibles à 375 px : « Pr o pr iét é », « Dé fa ut » coupés lettre à lettre.                                                | 66 en-têtes, 57 pages ; capture `components_button-375-light.png`.                                                                             | Défilement horizontal du tableau avec un nom de colonne par ligne, ou fiche par propriété à 375 px.            |
| E-5 | Orthotypographie française absente : espace ordinaire avant « : », « ; », « ? », « ! », dans « » et avant les unités ; « » séparés en fin de ligne. | Chiffres ci-dessus ; octet 0x20 vérifié dans `components/alert/index.html` ; `/` : « convention » / « » coupé sur deux lignes.                 | Espace insécable (U+00A0) avant « : », fine insécable (U+202F) avant « ; ? ! » et « % », guillemets, milliers. |
| E-6 | Pas de page 404 : `dist/` ne contient que `index.html` à la racine ; `/components/` renvoie la 404 de l'hébergeur.                                  | `ls apps/docs/dist/*.html` ; `src/pages/` sans `404.astro` ; `/components/` absent (la liste est `/composants/`).                              | Ajouter `404.astro` (retour à l'accueil, recherche, sommaire) ; décider du sort de `/components/`.             |

### Moyen

| #   | Constat                                                                                                                                                         | Page, preuve                                                                                                                                                             | Correction proposée                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| M-1 | Le menu « Composants » (un h2 et neuf h3) précède le h1 sur 80 pages : les lecteurs d'écran listent dix titres avant le titre de la page.                       | Liste des titres de chaque page (extraction) ; `PageNav.astro`.                                                                                                          | Sortir ces intitulés des niveaux de titre (`<p>` ou `aria-label`).                    |
| M-2 | `/components/prose/` a deux h1 (celui de la page et « Titre 1 » de l'exemple).                                                                                  | Extraction : `H1:Prose`, `H1:Titre 1`.                                                                                                                                   | Descendre l'exemple d'un niveau ou le sortir des titres.                              |
| M-3 | Liens de démonstration qui mènent à des 404 : `/components/`, `/projets/design-system`, `/projets/outils`, `/projets/nouveau`, `/etiquettes/astro`.             | `breadcrumb`, `card`, `empty-state` (5 liens) ; ancres vides `#typographie`, `#performance` (`cluster`), `#page-N` (`pagination`, 9).                                    | Cibles `href="#"` neutres ou pages existantes ; ancres vers des ids présents.         |
| M-4 | Apostrophe droite dans 46 pages : `/decisions/` (21), `/glossaire/` (19), tableaux de propriétés, 2 titres (`/decisions/0004/`, `/declaration-accessibilite/`). | 149 cas hors SVG ; 24 dans les `desc` SVG des graphiques (lues par les lecteurs d'écran).                                                                                | Apostrophe courbe `’` partout (`encre-voix` : majoritaire dans le site).              |
| M-5 | En-tête à 375 px : trois rangées (marque, deux lignes de liens) plus un bouton « Menu », environ 207 px sur 800.                                                | Capture `recherche-375-light.png` ; `MobileMenu.astro`.                                                                                                                  | Une rangée : marque et « Menu » ; liens dans le panneau.                              |
| M-6 | Identifiants de code écrits en texte brut : `aria-hidden="true"`, `live="polite"` sans `<code>`.                                                                | 592 guillemets droits hors code, 48 pages (`/components/photo/` 58, `cluster/` 48).                                                                                      | Mettre les identifiants en `<code>` dans les listes d'usage.                          |
| M-7 | Textes de page en brouillon : « Brouillon à relire par Paul ».                                                                                                  | 14 pages : `/`, `/auteur/`, `/architecture/`, `/accessibilite/`, `/declaration-accessibilite/`, `/confidentialite/`, `/mentions-legales/`, ADR 0001 à 0004, 0006 à 0008. | Relecture de Paul (#112), puis retrait. Hors périmètre d'un agent.                    |
| M-8 | Termes non expliqués : le glossaire compte 39 entrées ; manquent APCA, CI, CLI, DTO, e2e, LTTB, ΔE, build, props, slot, workflow.                               | Occurrences : build 66, props 80, e2e 42, CI 26, slot 13, LTTB 9, DTO 4 (hors SVG).                                                                                      | Ajouter les termes au glossaire, lier la première occurrence par page (`Term.astro`). |

### Faible

| #   | Constat                                                                                                                                 | Page, preuve                                                                  | Correction proposée                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| F-1 | Voix : « Nos choix » (h2), « Nous construisons », « de notre part » ; « Une action permet de sortir… ». `encre-voix` interdit « nous ». | `/accessibilite/`, `/decisions/0003/`, `/components/empty-state/`.            | Réécrire à l'impératif ou à la 3e personne.                          |
| F-2 | 21 phrases de plus de 35 mots (seuil de 25 : préférence), surtout dans les ADR ; 57 et 68 mots dans `/decisions/0006/`, `/0007/`.       | Extraction des `p` et `li` ; `npm run check:readability` : 53 avertissements. | Couper ; les ADR peuvent garder leur forme (archive datée).          |
| F-3 | Colonne de lecture de 36 rem laissée à gauche à 1280 px : la moitié droite est vide ; blocs de code coupés (« …bin.ts cr »).            | `utiliser-1280-dark.png`.                                                     | Laisser les `pre` défiler avec indice, ou élargir les blocs de code. |
| F-4 | Redirections : `cnil.fr` (301 vers `/fr`), formulaire du Défenseur des droits (302).                                                    | Liens externes ; `confidentialite`, `accessibilite`.                          | Mettre les URL finales.                                              |
| F-5 | Titres de `<title>` redondants ou longs : « Utiliser le design system · Design system · Paul Perigault », ADR de plus de 70 caractères. | Extraction (`title`).                                                         | Retirer la répétition ; titre court des ADR.                         |
| F-6 | `/recherche/` fait 6 mots sans JavaScript ; le message `noscript` colle le lien (« le<a>sommaire »).                                    | `recherche/index.html`.                                                       | Corriger l'espace ; garder le message.                               |

### Ce qui tient

- 0 violation axe (WCAG 2.0 à 2.2 A et AA, bonnes pratiques) sur 80 pages × 2 largeurs × 2 thèmes ; le contraste est donc conforme aux seuils d'axe, clair et sombre.
- Aucun défilement horizontal de page (375 et 1280 px), aucune cible sous 24 px hors liens en ligne, aucun texte sous 14 px hors SVG.
- `lang="fr"`, un titre unique par page, descriptions de 124 à 166 caractères, sitemap égal aux pages.
- Aucun emoji, aucun « vise à », aucune tournure d’IA trouvée par les expressions de la grille, aucun `[A VERIFIER]` resté dans une page.
- Démonstration vivante de l'accueil (KpiCard, LineChart, tableau lié) : conforme à ADR-0008 décision 1.

## Pistes par type de page (grille encre-design, encre-mobile, ADR-0008)

| Type de page    | Constats                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| Accueil         | C-1, E-2, E-5, M-5, M-7 ; deux entrées claires, preuve visible           |
| Démarrer        | C-1, E-2 (6 collages), F-3 ; « cinq minutes » tient en quatre lignes     |
| Fiche composant | C-1, E-3, E-4, M-1, M-6 ; structure identique sur 53 fiches (bon repère) |
| Données         | E-2 (12 collages), graphiques lisibles à 375 px                          |
| Longue lecture  | ADR : C-1, M-4, F-2, F-5                                                 |
| Légales         | M-7, F-4                                                                 |
| Recherche       | M-5, F-6 ; champ et bouton visibles                                      |
| 404             | E-6                                                                      |

## Sources

Consultées le 2026-11-02. Texte paraphrasé, rien de copié.

| Source                                                    | URL                                                                                                                              | Niveau                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Lexique des règles typographiques, Imprimerie nationale   | `https://www.imprimerienationale.fr/lexique-des-regles-typographiques`                                                           | [À VÉRIFIER] : 301 vers `ingroupe.com`, puis 404 ; règles non relues |
| WCAG 2.2, 3.1.5 Niveau de lecture (AAA)                   | https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html                                                                   | norme                                                                |
| Making Content Usable… (COGA), note du W3C, 29 avril 2021 | https://www.w3.org/TR/coga-usable/                                                                                               | norme (note, non normative)                                          |
| Unapei, L'information pour tous (règles FALC)             | https://www.unapei.org/publication/linformation-pour-tous-regles-europeennes-pour-une-information-facile-a-lire-et-a-comprendre/ | convention ; règles dans un PDF non lu : [À VÉRIFIER]                |
| GOV.UK Design System, Get started                         | https://design-system.service.gov.uk/get-started/                                                                                | convention                                                           |
| shadcn/ui, Installation                                   | https://ui.shadcn.com/docs/installation                                                                                          | convention                                                           |
| Carbon Design System, Get started                         | https://carbondesignsystem.com/developing/get-started/                                                                           | convention                                                           |
| Primer (GitHub), Getting started                          | https://primer.style/product/getting-started/                                                                                    | convention                                                           |

Ce que les références apportent (paraphrase) :

- WCAG 3.1.5 (AAA) : au-delà du niveau de fin de collège, fournir un résumé en langage simple ou une
  version simplifiée. Le projet cible AA, AAA partiel : le critère sert de repère, pas d'exigence.
- COGA : huit objectifs (comprendre, trouver, clarté, erreurs, concentration, mémoire, aide,
  personnalisation) ; pour la clarté : mots simples, phrases courtes, abréviations expliquées, résumés.
  Un document de travail, non requis pour la conformité.
- GOV.UK : deux guides de démarrage selon l'usage (prototype, production), exemples au code réutilisable.
- shadcn : trois voies d'installation, une page par cadre, commandes copiables, sommaire de page et
  précédent/suivant. Piste pour « Démarrer » (un chemin par cadre) quand les paquets seront publiés.
- Carbon : démarrage par pile technique, composants regroupés en « briques ». Primer : statut des
  composants affiché avant l'usage. Pistes : afficher le statut (stable ou non) sur chaque fiche.

## Suites

Issues par groupe (liens, orthotypographie, contenu et voix, UX/UI par type de page, accessibilité
cognitive) et deux issues [CI] : contrôle des liens, contrôle d'orthotypographie. Numéros : #207 à #213 (#206 pour l’audit),
détail dans `docs/journal/2026-11-02.md`. Non mesuré : tests avec des visiteurs (étape de Paul, ADR-0008
décision 7), lecteurs d'écran réels, contraste calculé hors axe.
