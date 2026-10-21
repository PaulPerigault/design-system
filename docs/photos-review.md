# Revue des photos

Demandée par le §5 du prompt de lancement : réutiliser les photos du portfolio, proposer
recadrages et textes `alt`, lister ce qui reste à décider par le propriétaire. État au
2026-10-21.

## Inventaire

| Fichier (portfolio)         | Dimensions    | Métadonnées        | Usage                                    |
| --------------------------- | ------------- | ------------------ | ---------------------------------------- |
| `src/assets/photo.jpg`      | 200 × 200 px  | aucune (EXIF, ICC) | portrait du héros, `<Picture>` AVIF/WebP |
| `public/image/og-cover.png` | 1200 × 630 px | générée par script | carte de partage (pas une photo)         |

Le portfolio n'a **aucune photo de projet** : les projets sont des cartes de texte alimentées par
l'API GitHub. La documentation du design system n'utilise que des images d'exemple générées
(aplats géométriques, `packages/astro/scripts/samples.ts`), sans visage.

## Portrait : constats

1. **Résolution insuffisante.** Le portrait est affiché à 160 px CSS (`size-40`), puis 208 px
   à partir de `md` (`size-52`). Un écran 2× demande 320 à 416 px réels : la source de 200 px
   est agrandie, donc floue sur la plupart des téléphones et des écrans Retina. Il faut une
   source d'au moins **832 px** de côté pour couvrir 2× sur la plus grande taille avec de la
   marge de recadrage (convention : deux fois la taille d'affichage maximale).
2. **Texte alternatif.** `alt={SITE.name}` répète le nom affiché juste à côté, dans le titre.
   Un lecteur d'écran lit donc « Paul Perigault » deux fois.
3. **Format.** `formats={['avif']}` avec repli WebP : correct. `Photo` du design system ferait
   de même (AVIF puis WebP, repli JPEG) et ajouterait le fond d'attente à la couleur dominante.

## Propositions

| Usage                         | Recadrage                                             | Point focal | `alt` proposé                                                            |
| ----------------------------- | ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| Héros (actuel)                | carré 1:1, visage et épaules, tête au tiers supérieur | `top`       | `""` (décoratif : le nom est le titre voisin)                            |
| Avatar (signature, auteur)    | carré 1:1, visage seul                                | `top`       | `""` à côté du nom ; sinon « Paul Perigault »                            |
| Carte « À propos » éventuelle | portrait 4:5 (`--pp-ratio-portrait`)                  | `top`       | « Paul Perigault, portrait » seulement si aucun nom n'est affiché à côté |
| Carte de partage (OG)         | inchangée (générée, sans photo)                       | —           | —                                                                        |

Choix du `alt` vide pour le héros (convention WCAG, technique H67 et arbre de décision du W3C
« An alt Decision Tree ») : l'image n'apporte pas d'information que le texte voisin ne donne
pas déjà. Si le propriétaire préfère que le portrait soit annoncé, le texte doit dire autre chose
que le nom (par exemple « Portrait de Paul Perigault »).

## À décider par le propriétaire

1. **Fournir un portrait source d'au moins 832 × 832 px** (idéalement l'original de l'appareil),
   sans métadonnées de localisation : le garde-fou `check-images` refuse toute image versionnée
   qui contient de l'EXIF ou du GPS.
2. Valider le recadrage du héros (visage au tiers supérieur, épaules visibles) ou en choisir un
   autre.
3. Valider le `alt` vide du héros, ou choisir un texte qui ne répète pas le nom.
4. Décider d'ajouter ou non des visuels de projets (captures d'écran). Sans décision, les cartes
   restent textuelles : rien ne manque à l'accessibilité ni au contenu.

Fondement à citer avec mesure : les visages font l'objet de jugements de confiance en environ
100 ms (Willis & Todorov, 2006, _Psychological Science_). C'est une raison de soigner le
portrait, **pas** une preuve qu'une photo aide à être recruté.
