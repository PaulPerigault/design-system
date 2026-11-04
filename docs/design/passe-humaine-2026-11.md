# Passe humaine des pages du site (2026-11)

Issue : #266. Lecture seule : aucune page de `apps/docs/src` n'a été modifiée. Rien n'est appliqué sans
réponse écrite de Paul. Date de la passe : 2026-11-03, sur la version construite de `main`.

## Méthode

- Grille : `encre-voix` (tournures « faites par IA », superlatifs, mots d'agence, verbes d'intention,
  chiffres sans source, jargon, phrases de plus de 25 mots hors ADR), `encre-accessibilite` (titres,
  libellés, textes alternatifs, liens) et `encre-cas-limites` (libellés longs, états vides).
- Lu : les sources des 19 pages de premier niveau (`apps/docs/src/pages/*.astro`), les titres et `h1` des 82 pages de
  `apps/docs/dist`, la sortie de `npm run check:readability` (57 avertissements : phrases longues et voix
  passive), une recherche par mots (superlatifs, mots d'agence, verbes d'intention), les textes
  alternatifs (`alt=`), l'état vide de la recherche et de la page 404.
- Niveau de preuve : **fait** = vérifiable dans un fichier cité ; **convention** = règle écrite d'un skill
  du dépôt, sans source externe ; **préférence** = goût à confirmer (`encre-voix` le dit pour les
  phrases de plus de 25 mots).
- Les textes validés par Paul (accueil, architecture, auteur, ADR, etc.) ne sont proposés que si une règle
  est clairement enfreinte. Le reste est conservé (voir « Conservé »).

## Résumé

| Groupe                        | Lignes du tableau | À traiter en premier                        |
| ----------------------------- | ----------------- | ------------------------------------------- |
| Faits faux ou périmés         | 1, 2, 3           | 1 (neuf paquets, pas sept) et 3 (titre ADR) |
| Voix                          | 4, 5, 6, 7        | 6 (phrase de 49 mots)                       |
| Accessibilité et libellés     | 8, 9              | 8 (balisage dans `<title>`)                 |
| Jargon sans glossaire         | 10                | Entrées de glossaire (code, pas texte)      |
| Phrases longues, voix passive | 11, 12, 13        | Préférence : à confirmer                    |

## Tableau

Les numéros renvoient aux lignes ci-dessous. « Ligne » = ligne de la source `.astro`, `.ts` ou du HTML.

### Faits faux ou périmés

| N°  | Page et ligne                                                           | Texte actuel                                                                                       | Texte proposé                                                                                                                                                         | Règle enfreinte                                                                                   | Preuve                                                                                                            |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | `/` : `index.astro:48` ; `/architecture/` : `architecture.astro:27, 32` | « Sept paquets npm … : tokens, css, dataviz, astro, guards, create et mcp » ; « sept paquets npm » | « Neuf paquets npm … : tokens, css, dataviz, color, data, astro, guards, create et mcp » (nombre calculé depuis `PACKAGES`, ligne de `lib/architecture.ts` à ajouter) | Chiffre sans source (`encre-voix`, Preuves) : le tableau d'`AGENTS.md` en liste neuf              | Fait : `AGENTS.md`, tableau « Projet » (9 paquets, `color` et `data` compris) ; `lib/architecture.ts:4` en a sept |
| 2   | `/preuves/` : `src/data/proofs.json`                                    | 1 331 tests unitaires, 3 197 e2e, 36 pages, 30 termes de glossaire, « mesuré le 2026-10-23 »       | Régénérer le fichier ; le texte de la page ne change pas                                                                                                              | Chiffre périmé présenté comme « mesuré »                                                          | Fait : `npm test` du 2026-11-03 donne 2 827 tests ; `dist/` compte 82 pages ; le JSON date du 2026-10-23          |
| 3   | `/decisions/0009/` : `<title>` (rendu)                                  | `<title>ADR-0009 — … jamais en <a href="/glossaire/#ci">CI</a> · Design system …</title>`          | `ADR-0009 — VoiceOver piloté à la main avec Guidepup, jamais en CI · Design system · Paul Perigault` (pas de lien dans le titre)                                      | Titre de page : texte brut (`encre-accessibilite`) ; un lien dans `<title>` s'affiche en balisage | Fait : `dist/decisions/0009/index.html`, seule page touchée ; `og:title` est correct                              |

### Voix

| N°  | Page et ligne                                | Texte actuel                                                                                                                                                               | Texte proposé                                                                                                                                                                                                                                              | Règle enfreinte                                                   | Preuve                                                                                                                                       |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | `/accessibilite/` : `accessibilite.astro:35` | « Cette page décrit ce que le design system vise, ce qui est testé et où en est la conformité. »                                                                           | « Cette page liste les critères testés, ceux qui ne le sont pas et l'état de la conformité. »                                                                                                                                                              | Verbe d'intention (« vise ») ; passif                             | Convention : `encre-voix`, « Verbes d'intention »                                                                                            |
| 5   | `/auteur/` : `auteur.astro:25`               | « Cette page ne donne ni formation, ni employeur, ni date : seuls les faits du dépôt sont écrits. »                                                                        | « Seuls les faits du dépôt figurent ici : pas de formation, pas d'employeur, pas de date. » (ou garder, la négation est vraie et utile)                                                                                                                    | Triplet négatif (`encre-voix`) ; texte validé par Paul, à décider | Convention. Page citée comme modèle par `encre-voix` (D-021) : probablement conserver                                                        |
| 6   | `/sobriete/` : `sobriete.astro:39`           | Une phrase de 49 mots : « Mesure du 2026-11-01, sur mon poste Windows …, pour `/`, la page du bouton, le tableau de bord et cette page : LCP …, deux fichiers de police. » | « Mesure du 2026-11-01, sur mon poste Windows avec Chromium : LCP de 0,98 à 1,26 s, INP de 56 à 96 ms, CLS de 0, JavaScript de 1 005 octets en gzip, deux fichiers de police. Pages mesurées : `/`, la page du bouton, le tableau de bord et cette page. » | Plus de 25 mots (préférence de `encre-voix`)                      | Préférence ; chiffres conservés tels quels (source : `perf.spec.ts`, D-021)                                                                  |
| 7   | `/auteur/` : `auteur.astro:60`               | « La sécurité fait partie du produit. `AGENTS.md` interdit l'attribut `style` en ligne … »                                                                                 | Supprimer la première phrase ; « `AGENTS.md` interdit l'attribut `style` en ligne pour tenir une CSP stricte, et la décision D-024 … »                                                                                                                     | Affirmation de vente avant le fait (`encre-voix`, « et alors ? ») | Préférence. Les autres amorces (« Les choix sont datés », « Les limites sont dites ») sont des étiquettes qui précèdent un fait : conservées |

### Accessibilité et libellés

| N°  | Page et ligne                                                                 | Texte actuel                                                                                    | Texte proposé                                                                                                                                     | Règle enfreinte                                                                             | Preuve                                                                                                           |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 8   | `/auteur/` : `auteur.astro:76` ; `/accessibilite/` : `accessibilite.astro:80` | `<p>contact : contact@paulperigault.fr</p>`                                                     | `<p>Courriel : <a href="mailto:contact@paulperigault.fr">contact@paulperigault.fr</a></p>` (ou texte brut si Paul craint le courrier indésirable) | Libellé en minuscule ; adresse non cliquable ; les trois autres pages affichent « Contact » | Convention : `encre-accessibilite` (liens, libellés). Le courrier indésirable est un risque réel, non mesuré ici |
| 9   | `/404/` et `/recherche/` (états vides)                                        | « L'adresse demandée n'existe pas dans cette documentation. » ; « Aucun résultat pour « zzz » » | Conservé : l'état vide dit ce qui manque et propose la recherche, l'accueil et le sommaire                                                        | Aucune règle enfreinte                                                                      | Fait : `404.astro`, `search-results.ts:42` testé                                                                 |

### Jargon sans glossaire

| N°  | Page et ligne                                                                                                                   | Texte actuel                                                                                    | Texte proposé                                                                                                                                                 | Règle enfreinte                                                 | Preuve                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 10  | `/auteur/` (OIDC), `/sobriete/` (brotli, gzip), 22 pages (axe), 5 (Playwright), 10 (SVG), `/` et `/auteur/` (DevOps, DevSecOps) | Termes employés sans entrée au glossaire (`/glossaire/` a 41 entrées, dont CSP, ADR, LCP, SBOM) | Ajouter des entrées dans `apps/docs/src/lib/glossary-*.ts` : OIDC, trusted publishing, axe, Playwright, gzip, brotli, SVG, DevSecOps (aucune page à modifier) | Jargon non expliqué (`encre-voix`, abréviations sans glossaire) | Fait : comptage dans `dist/*/index.html` (occurrences) contre les ancres de `dist/glossaire/` |

### Phrases longues et voix passive (préférence)

| N°  | Page et ligne                                                            | Texte actuel                                                                                                                                                                                                                             | Texte proposé                                                                                                                                                                                                                                                                                                                | Règle enfreinte                                                                               | Preuve                                        |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 11  | `/sobriete/` : `sobriete.astro:52`                                       | « C'est un modèle descendant : il applique au volume transféré une énergie par gigaoctet pour trois segments (centres de données, …) » (38 mots)                                                                                         | « C'est un modèle descendant. Il applique au volume transféré une énergie par gigaoctet, pour trois segments : centres de données, réseaux, appareils. »                                                                                                                                                                     | Plus de 25 mots (préférence)                                                                  | Préférence                                    |
| 12  | `/composants/bar-chart/` : `bar-chart.astro:87`                          | « Limite : un libellé plus long que sa bande (environ sept caractères à cinq catégories, six à six catégories) est tronqué (« Référe… ») ; le texte complet reste dans le title et dans le tableau lié. » (37 mots)                      | « Limite : un libellé plus long que sa bande est tronqué (« Référe… »). Une bande reçoit environ sept caractères à cinq catégories, six à six. Le texte complet reste dans le `title` et dans le tableau lié. »                                                                                                              | Plus de 25 mots (préférence)                                                                  | Préférence ; les nombres restent ceux du test |
| 13  | `/declaration-accessibilite/` : `declaration-accessibilite.astro:92, 98` | « L'article 47, lu sur Légifrance le 3 novembre 2026, vise … » (35 mots) ; « Il n'est pas établi qu'il entre dans le champ de l'article 47 : le seuil n'a pas été lu [À VÉRIFIER], ni le champ de la directive [À VÉRIFIER]. » (29 mots) | « L'article 47 (Légifrance, lu le 3 novembre 2026) vise les personnes morales de droit public, certaines personnes morales de droit privé et les entreprises au-dessus d'un seuil de chiffre d'affaires. » ; « L'entrée de ce site dans le champ n'est pas établie : le seuil et la directive restent à lire [À VÉRIFIER]. » | Plus de 25 mots ; passif (« est présentée »). Texte écrit par l'agent dans #264 et non validé | Préférence                                    |

## Conservé (règle non enfreinte)

- Titres de page : chaque `<title>` dit la page (« Préfixe · Design system · Paul Perigault ») ; les 53
  pages composant portent le nom du composant, un `h1` identique. `/donnees/` a le `<title>` « Données » et
  le `h1` « Visualisation de données » : deux formulations d'une même page, conservées.
- ADR : titres longs conservés (la règle de 25 mots exclut les ADR).
- Textes alternatifs (`alt=`) : décrivent ce que montre l'image (« Composition géométrique : disque bleu
  et colonne grise … ») ; `alt=""` réservé aux images décoratives (`photo.astro`).
- Passif de la documentation technique (« est chargé », « sont publiés ») : 29 des 57 avertissements de
  `check:readability` sont du passif sur des phrases courtes qui décrivent un état. À conserver, sauf la
  ligne 4.
- Superlatifs, mots d'agence, verbes d'intention : la recherche par mots n'en trouve qu'un (ligne 4,
  « vise »). Les « complet », « complètement » restants décrivent un fait (« tableau complet »).
- Chiffres vérifiés : 13 appareils (`MATRIX.length` = 13), versions de `/credits/` (astro 7.4.1, vitest
  4.1.12, etc. : égales à `node_modules`).

## Limites de cette passe

- Lu : sources `.astro` et HTML construit, pas le rendu dans un navigateur ni les 53 pages composant en
  détail (seulement titres, `alt`, phrases longues, mots recherchés).
- Pas de test avec des lecteurs d'écran ; pas de relecture des ADR (hors périmètre de la règle des 25 mots).
- Les textes de `mentions-legales`, `confidentialite` et `declaration-accessibilite` portent encore des
  champs « à compléter » ou [À VÉRIFIER] (#264) : ils ne sont pas jugés ici.

## Décision de Paul (2026-11-04)

- Lignes 1 à 3 : faites (PR #271), vérifié le 2026-11-04.
- Appliquées (#285, D-157) : 4, 6, 7, 8, 10, 11, 12, 13.
- Gardées telles quelles : 5, 9.
- Ligne 10 : seule l'entrée DevSecOps manquait au glossaire.
