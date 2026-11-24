# ADR-0014 : Badges en images HTML intactes, support 3D fixe, empreinte stable

- Statut : accepté (2026-11-24), décisions du propriétaire. Remplace la partie « badge en texture » de l'ADR-0013 (section « Règles appliquées », décision 2 du rendu, textures et budget). Le reste de l'ADR-0013 reste en vigueur.
- Lié : ADR-0013, ADR-0012, D-198, chantier #399.

**En trois phrases.** Un badge de certification ne se déforme pas : mis en texture sur une médaille, il est en perspective, incliné au survol et réduit, ce que les conditions d'usage des émetteurs interdisent. Le badge devient une vraie image HTML, de face, posée par `project()` sur un support 3D clair fixe ; seul le support s'incline. La même décision règle deux défauts mesurés : le badge trop petit au mobile et le décalage de mise en page quand la scène arrive tard.

## Contexte

Mesures après l'ADR-0013 (Chromium, 4G lente, CPU x6) : au mobile la médaille active occupe 33 à 38 % de la largeur (badge d'environ 100 px, texte en arc du badge Google Cloud illisible) ; si la scène est prête plus de 500 ms après le geste, la liste devient une bande d'étapes et la mise en page se décale (CLS 0,26 au bureau, 0,66 au mobile), invisible pour Lighthouse. Les conditions d'usage lues pour l'ADR-0013 interdisent de déformer ou de modifier un badge (AWS : « non modifié », sans déformation ni superposition).

## Décisions du propriétaire

1. **Image HTML, jamais texture.** Une `<img>` par médaille obtenue, superposée à la scène et positionnée par `project()` comme les étiquettes. Le badge est toujours de face : aucune rotation, inclinaison, perspective, éclairage, filtre, transparence variable, recadrage ni arrondi qui rogne. Seules transformations : translation et mise à l'échelle **uniforme** (rapport largeur/hauteur naturel conservé).
2. **Support fixe.** La médaille 3D est un support clair fixe (jeton `--pp-color-bg` résolu en clair, y compris en thème sombre) sur lequel le badge se pose. L'inclinaison au survol ne concerne que le support. Le survol n'avance ni n'agrandit plus le support, pour que le badge reste centré dessus.
3. **Toutes les médailles obtenues** gardent leur badge le long du chemin, mis à l'échelle selon la taille projetée. Un jalon planifié n'a pas de badge : fantôme filaire.
4. **Lecteurs d'écran et interactions.** `aria-hidden="true"`, `alt` vide : la liste et le panneau portent déjà le nom et l'image avec leur texte alternatif. Survol, focus, clic et toucher sur l'image visent la même cible logique que la médaille (survol et sélection relayés au pilote), sans piège clavier (image hors de l'ordre de tabulation).
5. **Mouvement.** Pas d'animation d'opacité sur le badge ; `visibility` seulement quand la médaille sort du cadre ou passe derrière la caméra. `prefers-reduced-motion` respecté (aucune transition ajoutée).

## Décision technique

### Rendu

- `pp-milestones-wasm` ne charge ni ne plaque plus de texture : suppression de `setTexture`, du programme de shader du badge, des bitmaps conservés et de la texture de remplacement du préchauffage. `Part::Badge` disparaît du maillage. `badge.src` reste une donnée du jalon, consommée par l'HTML.
- `project()` rend, par étape, centre normalisé, rayon et visibilité du support ; la taille du badge se déduit du rayon (`BADGE_SPAN` du diamètre du support, marge visible autour). Le badge est un `translate` plus un `scale` uniforme : sa taille naturelle est mise à l'échelle sans jamais toucher l'un des côtés seul.
- Rupture d'API assumée, sans compatibilité : `init` n'accepte plus `onTextureError`, `Scene.setTexture` disparaît. Le portfolio, seul consommateur, est adapté ensuite.

### Taille au mobile

La médaille active est cadrée pour que le badge fasse au moins 150 px CSS à 390 px de large (45 % de la largeur visée). L'enveloppe déclare le canevas « compact » (`setCompact`) quand sa largeur CSS est sous 480 px : la scène cadre alors la médaille active seule, en grand (support sur 0,64 de la demi-largeur, badge sur 88 % du diamètre du support), au-dessus d'une place d'étiquette plus haute ; les voisines peuvent être partiellement rognées par le bord. Le rapport d'écran ne suffit pas à distinguer le téléphone du bureau (0,98 et 0,95 mesurés avec le panneau ouvert), d'où le drapeau. Hors format compact, le cadrage groupé (active et deux suivantes entières dans le cadre) est conservé. Testé pour des rapports d'écran de 0,4 à 2,5.

### Empreinte stable (CLS)

Le défilement n'est pas une entrée récente : l'exclusion des décalages après un geste ne couvre pas l'activation par défilement. Seule une empreinte identique avant et après l'activation garantit un CLS nul, quel que soit le délai.

- Le HTML serveur est mis en page dès le départ comme le mode amélioré : piste haute (selon le nombre d'étapes), cadre épinglé de la hauteur de l'écran, scène vide réservée, liste déjà en bande d'étapes, rangée de navigation réservée. Condition CSS `(scripting: enabled)` : sans JavaScript, la liste reste en flux normal. La piste haute dépend en plus de `(prefers-reduced-motion: no-preference)`, comme le mode `scroll`.
- À l'activation, le comportement ajoute le canvas (positionné en absolu), les boutons d'étapes (même boîte que le texte qu'ils remplacent) et la navigation (rangée déjà réservée) : aucun élément déjà peint ne bouge.
- Prop `reserve` (défaut `true`) : à `false`, aucune empreinte n'est réservée (page qui n'installe pas le comportement). Au repli (WebGL2 absent, économie de données, échec), la réservation est levée : un décalage unique, limité à ces appareils, mesuré dans le rapport.
- Le geste exigé avant l'activation d'une section déjà à l'écran (D-195) n'est plus demandé quand l'empreinte est réservée : la scène s'installe dès que la section approche du viewport. Il reste exigé avec `reserve={false}`.
- Zones de contrôle : un test compare chaque règle de réservation (`milestones-3d-reserve.css`) à sa jumelle du mode amélioré ; le nombre d'étapes est lu dans `data-pp-count` (1 à 25).

### Reproductibilité du `.wasm`

Le chemin de compilation (`/Users/...`, `/home/runner/...`) est embarqué dans le `.wasm` par les messages de panic et les noms de fichiers. `--remap-path-prefix` (via `RUSTFLAGS` dans le script de compilation) ramène le dossier du dépôt et celui de `$CARGO_HOME` à des préfixes fixes : le même source donne le même `.wasm` depuis deux dossiers.

## Alternatives écartées

- **Badge texturé corrigé** (anisotropie, mipmaps, rendu sans inclinaison) : la texture reste rééchantillonnée en perspective ; le texte en arc du badge Google se dégrade, et l'usage reste une modification de l'image.
- **Badge en `<img>` dans la scène seulement pour l'active** : décision 3 du propriétaire, le parcours montre toutes les médailles obtenues.
- **Badge incliné avec le support en CSS 3D** : toute rotation est une déformation.
- **Réserver l'empreinte seulement après un `ResizeObserver`/mesure** : le décalage a déjà eu lieu.
- **Reporter l'activation à un geste seulement** : ne couvre pas le défilement (pas une entrée récente).
- **Pastille de remplacement (`min-height` fixe) avec contenu masqué** : la liste doit rester lisible et indexable ; elle est la bande d'étapes dès le premier rendu.
- **`content-visibility` ou `contain: size`** : fixent une taille supposée, pas l'empreinte réelle de la liste et de la navigation.

## Conséquences

- Le contrat des données ne change pas (`badge.src`, `date`, `code` déjà exigés) ; le contrat du paquet change (plus de texture), le composant gagne la prop `reserve`.
- Le `.wasm` et le JS allègent (textures, shader, bitmaps, `createImageBitmap`).
- La hauteur de page réservée existe avant la scène : une page dont le comportement n'est pas installé doit passer `reserve={false}`.
- Une page avec `scripting: enabled` mais où le comportement échoue (réseau, CSP) garde sa piste haute vide tant que le repli ne s'exécute pas ; le repli lève la réservation.
