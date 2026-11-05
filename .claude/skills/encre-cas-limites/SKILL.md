---
name: encre-cas-limites
description: Éprouver un composant, une liste, un tableau ou un formulaire avec des données pires que la démo (texte long, vide, un seul élément, nombres, dates, langues, 320 px, zoom 200 %) et dérouler la liste avant livraison. « casse-le », « cas limites », « avant livraison ».
---

# Encre : cas limites et liste avant livraison

Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Skill réécrit depuis des
sources tierces (voir `PROVENANCE.md`) ; en cas d'écart, `AGENTS.md` gagne. Ce skill est de la
méthode, pas une preuve : « prouvé » seulement si une source l'établit, sinon « convention » ou
« préférence ».

## Surcharges Encre

- Pas de bascule « Démo / Pire cas » dans un composant publié (zéro JS par défaut) : le pire cas
  est une fixture de test (Vitest, `apps/docs/e2e/`) ou une page d'exemple de `apps/docs`.
- Pas de masque dégradé pour cacher une coupure : défilement avec bordure visible, ou pagination.
- Pas de bibliothèque de virtualisation (zéro dépendance inutile) : paginer, ou dire « à décider ».
- Propriétés logiques (`inline`, `block`), jamais `left` ni `width` figée ; `style` en ligne interdit (`AGENTS.md`).
- Rapport d'abord, correctifs ensuite, sur demande de Paul ; une PR à la fois, aucun sous-agent.
- Pas de phrase d'accueil imposée : on répond à la demande. Données d'essai en `example.org` ou `.test`.

## Comment l'utiliser

- Phrase de déclenchement : « casse `<composant ou page>` » (ou `/encre-cas-limites`).
- Lire le composant avant de juger ; citer `fichier:ligne` pour chaque casse.
- Sortie : trois parties (Ce qui casse, Décisions pour Paul, Ce qui tient). Voir « Rapport ».

## Principe

Les données de démonstration sont choisies, sans y penser, pour que le dessin tienne : noms courts,
champs tous remplis. On défait ce choix champ par champ, avec deux garde-fous.

1. **Plausible ou borné par le schéma.** Chaque valeur est un cas qu'un vrai utilisateur peut
   produire, ou la limite réelle du DTO (ADR-0006). Pas de `aaaa…` de 5 000 caractères. Sans limite
   écrite : écrire « non borné » et tester une valeur longue mais crédible.
2. **Ne pas s'arrêter au texte long.** Les casses livrées sont aussi le nom d'une lettre, le champ
   absent, le « 1 membres », la liste vide, l'étiquette traduite.

Le pire cas entre par la même frontière que la démo (fixture, propriété, réponse simulée), jamais en
retouchant le balisage : on teste le composant, pas sa propre retouche.

## Cartographier

Tableau : champ, source, type, limite, facultatif ? Y inclure les valeurs oubliées : compteurs
d'en-tête, dates relatives, textes d'état, libellés de bouton venus des données, `alt`, la longueur de
la liste elle-même. Chercher les limites dans les schémas, les types et les `maxlength`.

## Catalogue condensé (pires cas plausibles)

| Famille       | Valeurs à essayer                                                                      | Ce qui casse                                          |
| ------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Noms          | `Aleksandra Wiśniewska-Kowalczyk`, `Jo`, `J`, `王秀英`, `🦊 Fox`, ` Sam   Lee`, absent | retour à la ligne, initiales fausses, glyphe coupé    |
| Identifiants  | adresse longue en `example.org`, UUID, URL à 100 caractères, nom de fichier à versions | pas de point de coupe, troncature qui cache la fin    |
| Libellés      | `Benachrichtigungseinstellungen`, français +30 % de longueur, douze étiquettes         | bouton figé, rangée d'étiquettes en mur               |
| Nombres       | `0`, `1`, `1 284`, `1 000 000`, `-42,5`, `142 %`, `null`, `NaN`                        | pluriel codé en dur, séparateur de milliers, jitter   |
| Collections   | 0, 1, taille de page, taille de page + 1, 1 000 sans pagination                        | état vide absent, page 2 vide, rendu lent             |
| Temps         | à l'instant, il y a 12 jours, futur, `1970-01-01`, minuit près du changement de fuseau | « il y a 0 seconde », « -3 jours », jour décalé       |
| Médias        | image 404, aucune image, 4000×200, 200×4000, logo sombre en thème sombre               | pas de repli, déformation, logo invisible             |
| États         | chargement, erreur d'API, données partielles, tous les statuts à la fois               | message brut, rangées désalignées, largeurs variables |
| Environnement | 320 px, colonne de 280 px, 2 560 px, zoom 200 %, thème sombre, `dir="rtl"`, tactile    | hauteurs figées, icônes inversées, survol seul        |

Formater avec `Intl` (nombres, pluriels, dates relatives) : jamais de chaîne bâtie à la main. Le
français sépare les milliers par une espace fine insécable (U+202F) : tester les valeurs rendues.

## Signatures de casse et correctifs

| On voit                                         | Cause                                     | Correctif                                               |
| ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| Avatar ou icône écrasé en ovale                 | enfant flex qui rétrécit                  | `flex-shrink: 0` sur l'élément de taille fixe           |
| Texte qui déborde de sa boîte                   | `min-inline-size: auto` (flex)            | `min-inline-size: 0` sur la colonne de texte            |
| Adresse ou URL qui sort du cadre                | aucune occasion de couper                 | `overflow-wrap: anywhere` sur cet élément               |
| Action de fin repoussée ou rognée               | le milieu prend tout                      | milieu `min-inline-size: 0`, action `flex-shrink: 0`    |
| Badge sur deux lignes                           | badge autorisé à rétrécir                 | `white-space: nowrap`, décider qui cède à la place      |
| Mot coupé au milieu d'un titre                  | `word-break: break-all`                   | `overflow-wrap: anywhere` (coupe seulement si utile)    |
| Pastille centrée contre un nom sur trois lignes | `align-items: center`                     | aligner en haut dès que le texte peut passer à la ligne |
| Tiret orphelin à la place d'un champ absent     | repère rendu malgré l'absence             | omettre la ligne, ou réserver sa hauteur exprès         |
| « 1 membres », « 0 membre »                     | pluriel codé en dur                       | `Intl.PluralRules`, ou une chaîne par cas               |
| Chiffres qui sautent à la mise à jour           | chiffres proportionnels                   | `font-variant-numeric: tabular-nums`                    |
| Diacritiques coupés (vietnamien, thaï)          | `line-height` serré et `overflow: hidden` | interligne plus large, pas de rognage                   |
| Icône d'image cassée                            | aucun repli à l'erreur                    | repli (initiales), `object-fit: cover`                  |
| Texte tronqué sans moyen de le lire             | `text-overflow: ellipsis` seul            | valeur complète ailleurs (`title`, vue détaillée)       |

## Couper, tronquer ou limiter

Choix par champ, jamais global. **Couper** ce qu'il faut lire en entier pour identifier (noms,
titres). **Tronquer en fin** les métadonnées secondaires dont le début porte le sens, avec un moyen
de lire la valeur. **Tronquer au milieu** quand les valeurs diffèrent par la fin (fichiers, chemins).
**Limiter** (`line-clamp`) les aperçus de cartes. **Jamais** tronquer un nombre, un montant ou une date.

## Liste avant livraison (web statique)

- États : survol, focus, désactivé, chargement, erreur, vide, un seul élément, tous couverts.
- Contraste vérifié dans les deux thèmes, séparément ; l'information n'est jamais portée par la
  couleur seule.
- Clavier : ordre logique, focus jamais masqué par un en-tête collant ou un recouvrement, aucune
  action réservée au glisser.
- Formulaires : étiquette visible, aide, erreur à côté du champ ; plusieurs erreurs : résumé lié.
- Cibles ≥ `--pp-target-min` ; texte lisible à 320 px et à 200 % de zoom, sans défilement latéral.
- `prefers-reduced-motion` respecté ; aucun contenu qui défile seul sans pause.
- Aucune couleur, taille ni durée brute : jetons `--pp-*` (`AGENTS.md`).

## Rapport

1. **Ce qui casse**, du pire au moindre : gravité (Cassé : illisible ou action inatteignable ;
   Laid : lisible mais faux ; Fragile : tient, à un pas de casser), champ, valeur, effet, correctif.
2. **Décisions pour Paul** : les casses à plusieurs bonnes réponses, avec une recommandation.
3. **Ce qui tient** : les pires cas déjà gérés. Une fixture conservée sert de test de non-régression.

Fin : « Dis `corrige tout` ou `corrige 1, 3` ». Si rien ne casse pour un champ, le dire.

## Sources

Réécrit le 2026-11-02 depuis des textes sous licence MIT : voir `PROVENANCE.md` (URL, SHA, licence).
Aucune étude n'est citée ; les valeurs d'essai sont des conventions de test, pas des preuves.
