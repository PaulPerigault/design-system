# Pipeline d'images : mesure (#91)

Mesuré le 2026-11-01 sur la documentation construite (`apps/docs/dist/_astro`), Windows, Node 24,
Astro avec `sharp`. Le pipeline n'est pas modifié : cette page ne décide rien.

## Commande

```
npm -w @paulperigault/docs run build
npm run benchmark:images             # poids par image et par format, rapports à même largeur
npm run benchmark:images -- --build  # ajoute la durée d'un build à froid puis à chaud
```

La CI exécute la première forme après le build de la documentation et l'affiche dans le résumé
du job. Aucun seuil : le script sort toujours avec 0 (principe GreenOps, `encre-greenops`).

## Résultats (fait mesuré)

| Source        | Original | AVIF            | WebP            | Repli (JPEG ou PNG) |
| ------------- | -------: | --------------- | --------------- | ------------------- |
| capture       | 10,0 Kio | 7 × (9,7 Kio)   | 7 × (12,1 Kio)  | 8 × (53,2 Kio)      |
| carre         | 11,1 Kio | 7 × (13,0 Kio)  | 7 × (15,0 Kio)  | 7 × (43,2 Kio)      |
| large-etroit  | 10,5 Kio | 2 × (6,6 Kio)   | 2 × (6,9 Kio)   | 0                   |
| large         | 17,9 Kio | 5 × (10,8 Kio)  | 5 × (15,4 Kio)  | 6 × (66,6 Kio)      |
| paysage       | 11,0 Kio | 5 × (9,8 Kio)   | 5 × (13,0 Kio)  | 5 × (34,8 Kio)      |
| portrait      |  8,8 Kio | 5 × (5,4 Kio)   | 5 × (11,9 Kio)  | 5 × (39,0 Kio)      |
| **Total** (6) | 69,3 Kio | 31 × (55,3 Kio) | 31 × (74,2 Kio) | 31 × (236,7 Kio)    |

- 31 variantes par format, pour 6 sources.
- À même source et même largeur, médiane des paires : AVIF = 94 % du poids WebP (29 paires),
  AVIF = 29 % du repli (27 paires), WebP = 36 % du repli (27 paires).
- Build de la documentation : 24,4 s à froid (cache d'images vidé), 22,9 s à chaud. Mesure du
  2026-10-31 : 25,2 s et 26,9 s. Les deux séries se recoupent : l'écart à chaud n'est pas établi.
- Limite : six images de test, générées pour la documentation. Ce n'est pas un échantillon de
  photographies.

## Lecture

- **Fait** : sur ces six images, AVIF pèse moins que WebP, lui-même bien moins que le repli. Le
  repli est servi aux seuls navigateurs sans AVIF ni WebP.
- **Convention** (source) : Google rapporte des fichiers WebP avec perte de 25 % à 34 % plus
  petits que JPEG à SSIM égal, sur les corpus Kodak, Tecnick, Lenna et un jeu de 11 000 images
  tirées du web (<https://developers.google.com/speed/webp/docs/webp_study>, page lue le
  2026-11-01, dernière mise à jour affichée 2025-08-07). L'écart mesuré ici (WebP à 36 % du
  repli) est plus grand que celui de l'étude : le repli du pipeline n'est pas réglé comme les
  JPEG de l'étude, la comparaison n'est donc pas à qualité égale. Aucune source n'est citée
  pour AVIF : l'étude de Netflix n'a pas pu être lue (HTTP 403), [À VÉRIFIER].
- **Préférence** : le coût du build (environ 24 s) ne justifie pas, seul, de réécrire le pipeline.
  Toute modification passe par une nouvelle issue.

## Suite possible (hors périmètre)

Mesurer la qualité perçue à poids égal (SSIM ou autre) avant de retirer un format.
