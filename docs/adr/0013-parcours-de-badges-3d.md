# ADR-0013 : Scène 3D de jalons, parcours de badges piloté au défilement

- Statut : accepté (2026-11-21), décisions du propriétaire. Remplace en partie l'ADR-0012 (rendu, interactions, modèle de données, repli sous `prefers-reduced-motion`). Le reste de l'ADR-0012 (Rust, WebGL2, crates, CSP, GreenOps, tests, livraison) reste en vigueur.
- Lié : ADR-0012, D-194, D-195, D-196, chantier #389.

**En trois phrases.** La première scène (un ruban décoratif et des médailles géométriques) n'apportait aucune information de plus que la liste HTML, et ne montrait aucun badge. La scène devient un parcours chronologique : la caméra avance le long d'un chemin quand la personne fait défiler la page, chaque certification obtenue est une médaille en volume dont la face porte le vrai badge, non modifié, et un panneau HTML ouvre son détail. La liste HTML complète reste la référence.

## Contexte

Retour du portfolio, premier consommateur : aucun badge visible, rien qui ressemble à des certifications, interactions inexistantes, ruban décoratif. Aucun paquet `@paulperigault/milestones-3d` n'est publié sur npm : l'API change sans compatibilité à préserver.

## Décisions du propriétaire (non remises en cause)

1. Les vrais badges Credly (images officielles) sont affichés partout, en 3D aussi.
2. La 3D est un parcours piloté au défilement : la caméra avance sur le chemin, chaque certification s'ouvre à son tour.
3. Le chemin raconte la chronologie réelle, du passé vers le futur, avec les dates. Espacement ordinal, dates affichées.

## Conditions d'usage des badges (lues le 2026-11-21)

| Émetteur        | Source                                                                                                                         | Ce qui en est retenu                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS             | [Certification, general policies, Brand Usage and Guidelines](https://aws.amazon.com/certification/policies/general-policies/) | Le badge doit rester non modifié, sur fond blanc ou très clair. Interdits : déformer, modifier le badge ou ses couleurs, superposer texte ou graphique, le placer sur un fond à motif, sur une image chargée ou à faible contraste, le combiner avec d'autres symboles, mots ou logos. Usage réservé à la personne certifiée, sans suggérer un niveau non obtenu ou non actif, ni un partenariat ou une recommandation d'AWS. |
| Credly          | [Workforce Skills User Terms of Service](https://info.credly.com/user-terms-of-service)                                        | Affichage public des badges obtenus permis (2.e). Ne pas laisser croire à une affiliation ou un soutien, ne pas copier ni encadrer l'apparence du service (4). L'émetteur peut révoquer un badge à tout moment (6.c) : un lien vers la page de vérification Credly reflète l'état réel.                                                                                                                                       |
| Google Cloud    | [Exam Terms and Conditions, section 4](https://cloud.google.com/certification/terms)                                           | La certification sert à indiquer que la personne, en tant qu'individu, est certifiée, selon les Google Brand Feature Guidelines en vigueur (non lues). Ne pas fausser le statut. Les pages lues ne disent rien de la modification, des couleurs ni des liens obligatoires.                                                                                                                                                    |
| Credly / Google | [Credly badges, Google Skills Help](https://support.google.com/qwiklabs/answer/14779166)                                       | Le badge numérique offre une vérification sécurisée et se partage en ligne.                                                                                                                                                                                                                                                                                                                                                   |

Non établi : les Google Brand Feature Guidelines ne sont pas lues. Par prudence, la règle stricte d'AWS s'applique à tous les badges.

### Règles appliquées

- Le badge est une texture plaquée à plat sur une face, **sans éclairage, sans filtre de couleur, sans recadrage, sans déformation** : le shader de la face échantillonne la texture et l'écrit telle quelle (alpha gérée par le mélange standard).
- Le support de la médaille (disque derrière et autour du badge) est **neutre et clair**, quel que soit le thème (la couleur vient du jeton `--pp-color-bg` résolu en mode clair). Aucune gravure, aucun texte, aucun motif ni autre logo ne chevauche le badge. Contourné sans trahir la décision : le badge est intact, c'est son support qui est neutre, y compris dans le thème sombre.
- Le nom complet de la certification est écrit en HTML (liste, panneau), avec un lien « Vérifier sur Credly » vers la page de vérification fournie par le consommateur.
- Seuls les jalons `achieved` portent un badge ; un jalon `planned` n'a pas de badge, jamais une image suggérant un niveau non obtenu. Le composant n'embarque aucune image : le consommateur fournit une image du même site.
- La documentation cite ces sources et rappelle que l'usage est réservé à la personne certifiée (pas à une entreprise).

## Décision

### 1. Modèle de données

`Milestone` : `id`, `label`, `group?` (émetteur), `status` (`achieved` ou `planned`), `date?` (`AAAA-MM` ou `AAAA-MM-JJ`, obtenue ou prévue), `code?` (code court lisible, par exemple le code d'examen), `badge?` (`{ src, width?, height? }` ; `src` : chemin relatif ou `https:`, WebP ou AVIF du même site), `href?` (lien de vérification). `Goal` : `label`, `date?`, `href?`, jamais de badge. Les emblèmes géométriques disparaissent. Aucune donnée de Paul dans le dépôt.

**Ordre** : le composant Astro trie les jalons par date croissante (tri stable ; un jalon sans date reste à sa place, derrière le jalon précédent). L'espacement sur le chemin reste ordinal (une unité de chemin par jalon), les dates sont affichées. L'objectif suit le dernier jalon.

### 2. Rendu (Rust et WebGL2)

- **Chemin** : spline de Catmull-Rom centripète passant par les jalons (positions ordinales, léger lacet latéral et dénivelé), rail en ruban plat en perspective qui suit la spline, avec une marque de jalon.
- **Caméra** : `setProgress(p)` avec `p` de 0 à 1 place la caméra sur la spline (position par abscisse curviligne, regard anticipé), avec un gros plan quand `p` tombe sur un jalon. Le lissage vers la cible est temporel, durées lues dans les jetons ; sous mouvement réduit, saut sans transition.
- **Médaille obtenue** : cylindre à bord biseauté (support neutre clair, éclairage de Lambert), face avant portant le badge en texture (mipmaps, anisotropie si l'extension existe, `LINEAR_MIPMAP_LINEAR`, pas de recadrage). **Planifié** : fantôme filaire de même silhouette, sans badge. **Objectif** : forme distincte (prisme étoilé en fil de fer plein), sans badge.
- Couleurs et durées lues dans les jetons (identité Encre, teinte 270). Aucune littérale.
- **Interactions** : `setHover(id | null)` (inclinaison douce qui suit le pointeur, anneau d'accent), `pick(x, y)`, `setActive(id)`, `project()` rend, pour chaque jalon et l'objectif, la position écran normalisée, l'échelle et la visibilité, pour poser les étiquettes HTML.
- **Textures** : `setTexture(id, ImageBitmap)` appelé par le wrapper après `fetch` puis `createImageBitmap` (redimensionné à 512 px au plus), en différé, hors du premier rendu. Médaille sans texture : support seul avec un anneau, sans badge.

### 3. Pilotage

- Section épinglée par `position: sticky` dans un conteneur dont la hauteur vaut 70 vh par jalon (objectif compris). La progression vient de la position de défilement. **Interdit** : `preventDefault`, détournement du défilement, `wheel` non passif. Retour en arrière fonctionnel. Un lien « Passer cette section » visible.
- Clic sur une médaille, clic sur une étape, boutons précédent et suivant, flèches du clavier : déplacent le défilement natif vers la position du jalon (`window.scrollTo`, `behavior: auto` sous mouvement réduit). Le défilement reste le pilote, y compris au tactile (`touch-action: pan-y`).
- Sous `prefers-reduced-motion: reduce` : pas de conteneur haut ni de sticky ; la scène est un bloc de hauteur d'écran, la navigation se fait par étapes (clic, boutons, flèches), la caméra saute d'un jalon à l'autre sans animation. Remplace le repli total de l'ADR-0012 : aucune perte d'information.

### 4. HTML

Panneau de détail en HTML (titre, émetteur, statut en toutes lettres, date, lien « Vérifier sur Credly »), indicateur d'étapes (un bouton par jalon avec le titre, `aria-current`), étiquettes de la scène (code, date) en HTML superposé, positionnées par `project()` via CSSOM (pas d'attribut `style`, CSP). La liste complète (`<ol role="list">`) reste dans le DOM comme référence ; en mode amélioré elle porte l'indicateur d'étapes. Aucun texte WebGL.

### 5. Repli

Inchangés : WebGL2 absent, perte de contexte, `saveData`, appareil faible, échec de `.wasm` : liste seule. Nouveau : échec de chargement d'une image : médaille sans badge, le texte reste en HTML.

### 6. Budget

`.wasm` visé sous 45 Ko brotli (le seuil de 60 Ko de l'ADR-0012 est abaissé), poids mesuré avant et après, dépassement justifié dans la PR. Textures : WebP ou AVIF du consommateur, 512 px au plus en GPU, mipmaps générés par `generateMipmap`.

## Contrôle visuel obligatoire

Avant le lot de rendu et avant de conclure : captures Playwright à 1440x900 et 390x844 (début, chaque jalon, objectif, gros plan du badge, survol, panneau ouvert), relues et jugées avec cette grille : badge reconnaissable et net, nom lisible, aucun chevauchement, obtenu distinct du planifié, objectif compréhensible, survol visible, panneau lisible au mobile, la section ne ressemble pas à un décor. Jusqu'à six itérations. Les images de test sont des avatars géométriques générés, jamais de vrais badges.

## Alternatives écartées

- **Badge dessiné ou recoloré aux couleurs Encre** : interdit par AWS (modification des couleurs).
- **Badge sous éclairage (Lambert, brouillard)** : altère les couleurs ; face non éclairée.
- **Support aux couleurs du thème sombre** : fond sombre interdit pour AWS ; support clair fixe.
- **Détournement du défilement (scroll-jacking, `wheel` capturé)** : contraire à WCAG 2.1.1 et à l'attente de la personne.
- **Texte dans le canvas** : inaccessible, flou ; étiquettes HTML.
- **Échelle de temps proportionnelle** : jalons rapprochés illisibles ; espacement ordinal avec dates affichées.
- **Modèle glTF ou texture atlas** : dépendance et poids sans nécessité (une dizaine de maillages procéduraux).
- **Garder les emblèmes géométriques** : sans valeur dès que le vrai badge est là.

## Conséquences

- Le contrat de données change (rupture assumée, rien n'est publié). Le portfolio doit fournir `badge.src`, `date`, `code`.
- Le wasm grossit des textures et de la spline, compensé par la suppression des emblèmes.
- La hauteur de page augmente de 70 vh par jalon en mode amélioré ; le lien « Passer cette section » et le mode réduit atténuent le coût.
