# @paulperigault/milestones-3d

Scène 3D de jalons en WebGL2 : un parcours chronologique piloté au défilement. Chaque certification
obtenue est une médaille en volume dont la face porte le vrai badge, non modifié ; un jalon prévu est
un fantôme filaire sans badge ; l'objectif a sa propre forme. Le rendu est écrit en Rust
(`crates/pp-milestones` et `crates/pp-milestones-wasm`, compilés en WebAssembly) ; ce paquet est
l'enveloppe TypeScript stricte qui valide les données, lit le thème dans la page, décide si la 3D est
admise, charge le `.wasm` puis les badges, et relaie les commandes et les événements. Aucun rendu en
TypeScript, aucune dépendance d'exécution.

La 3D n'est qu'une amélioration : la liste HTML complète reste la source de vérité (composant Astro
`Milestones3D`). Décisions : ADR-0012 et ADR-0013, chantiers #360 et #389.

Aucune version n'est publiée : l'API change sans compatibilité à préserver (série `0.x`).

## Installation

```bash
npm install @paulperigault/milestones-3d
```

Navigateur avec WebGL2 et WebAssembly. Sous CSP : `'wasm-unsafe-eval'` dans `script-src` et
`'self'` dans `connect-src` (pour charger le `.wasm`). Sans eux, `init` rejette avec `load-failed`
et le repli classique s'applique.

## Usage

```ts
import {
  canEnhance,
  enhanceEnv,
  init,
  prefersReducedMotion,
  readTheme,
} from '@paulperigault/milestones-3d';

const env = enhanceEnv(sectionIsVisible);
if (canEnhance(env)) {
  const handle = await init(canvas, data, readTheme(document.documentElement), {
    onSelect: (id) => scrollToStep(id),
    onHover: (id) => highlightLabel(id),
    onTextureError: (id) => console.warn(`badge de ${id} indisponible`),
    onFallback: (reason) => showClassicList(reason),
  });
  handle.setProgress(scrollProgress); // de 0 à 1, à chaque défilement
  for (const mark of handle.project()) placeLabel(mark); // après une image dessinée
  handle.destroy();
}
```

`init(canvas, data, theme, options?)` rend `Promise<MilestonesHandle>`. Elle valide `data`, charge le
`.wasm` une seule fois, crée la scène, branche les écouteurs et demande la première image. Les badges
se chargent ensuite (voir « Badges »). Un échec appelle `options.onFallback(raison)`, libère tout ce
qui a été créé, puis rejette avec une `MilestonesError`.

| Option           | Défaut                          | Rôle                                                             |
| ---------------- | ------------------------------- | ---------------------------------------------------------------- |
| `dprMax`         | 2                               | plafond du rapport de pixels                                     |
| `activeId`       | aucune étape active             | étape active au départ (`@goal` : l'objectif)                    |
| `onSelect`       | aucun                           | médaille choisie sur le canvas (clic ou toucher), via `pick`     |
| `onHover`        | aucun                           | étape sous le pointeur, `null` à la sortie (au changement seul)  |
| `onFallback`     | aucun                           | repli vers le rendu classique, avec la raison                    |
| `onTextureError` | aucun                           | le badge d'un jalon n'a pas pu être chargé                       |
| `themeRoot`      | parent du canvas, sinon `:root` | élément sous lequel les jetons sont lus (et relus au changement) |
| `gyroscope`      | `true`                          | inclinaison au gyroscope, demandée sur geste là où il le faut    |

`onSelect` n'est appelé que pour un clic ou un toucher sur une médaille (`pick`) ; il ne change pas
l'étape active ni la caméra. Entrée au clavier : c'est le HTML (boutons, liste), pas ce paquet.

### La poignée

```ts
interface MilestonesHandle {
  destroy(): void;
  setTheme(theme: Theme): void;
  setActive(id: string): void; // '' efface ; inconnu : lève unknown-id ; ne déplace pas la caméra
  setProgress(progress: number): void; // 0 à 1 ; non fini : lève progress
  setHover(id: string | null): void; // programmatique ; n'appelle pas onHover
  progressOf(id: string): number; // abscisse de l'étape sur le chemin, 0 à 1 ; -1 si inconnu
  project(): readonly MilestoneMark[];
}
interface MilestoneMark {
  id: string;
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}
```

- **Chaque commande planifie une image** : la scène n'agit qu'à la prochaine `frame`, avec l'horloge de
  frame (une scène au repos glisse quand même vers sa cible). Pour aller à un jalon :
  `handle.setProgress(handle.progressOf(id))`, ou, pilotée par le défilement, la position de
  défilement donne `p` directement.
- **`project()`** : un élément par étape, jalons dans l'ordre fourni puis l'objectif (`@goal`,
  constante `GOAL_ID`). Valeurs de la dernière image dessinée : appeler après une image. `x` et `y`
  sont de 0 à 1 avec l'origine en haut à gauche du canvas : c'est directement le repère du `.wasm`,
  sans changement. `scale` est le rayon de la médaille rapporté à la hauteur du canvas (rayon en
  pixels CSS = `scale` x hauteur CSS). `visible` : devant la caméra et centre dans le cadre. Les
  étiquettes HTML se posent avec ces valeurs par le CSSOM (jamais un attribut `style`, CSP).
- **Pointeur** : `pointermove` incline la scène et résout le survol par `pick` ; `pointerleave` rend
  la main ; un clic ou un toucher appelle `onSelect`. Écouteurs passifs, aucun `preventDefault`,
  aucun écouteur `wheel`, `touch*` ni `scroll` : le défilement natif n'est jamais bloqué.
  `touch-action: pan-y` reste côté CSS.
- **Après `destroy()`** : les commandes ne font rien, `progressOf` rend -1 et `project` rend `[]`.
  Un nettoyage tardif ne lève pas. Pas de `resize` public : la taille suit le `ResizeObserver`.

## Badges

Chaque jalon `achieved` peut porter `badge: { src, width?, height? }`. Après la création de la scène
et la première image dessinée, au temps libre du navigateur (`requestIdleCallback`, 1 s au plus ;
`setTimeout` sinon), chaque badge se charge, deux à la fois au plus :

1. `fetch(src, { credentials: 'same-origin', mode: 'same-origin' })` : images du même site, sans CORS ;
2. `createImageBitmap(blob, { premultiplyAlpha: 'premultiply', colorSpaceConversion: 'none',
imageOrientation: 'none' })` ; si l'image dépasse 512 px, elle est redécodée à 512 px au plus
   (`resizeQuality: 'high'`, proportions gardées). Avec `width` et `height` déclarés, un seul
   décodage suffit ;
3. `scene.setTexture(id, bitmap)` puis une image demandée.

Un échec (réseau, 404, image invalide, taille nulle, refus de la scène) appelle `onTextureError(id)`
et laisse la médaille sans badge : la scène n'échoue jamais pour une image. `destroy()` annule les
requêtes en cours (`AbortController`), vide la file et ferme les `ImageBitmap` non transmis. Section
jamais visible : aucun badge n'est demandé (pas d'image, donc pas de donnée mobile gaspillée).

Le badge est affiché tel quel, sans éclairage ni filtre (ADR-0013, conditions des émetteurs). Le
paquet n'embarque aucune image : le consommateur fournit une image du même site, qu'il est autorisé à
afficher (usage réservé à la personne certifiée).

## Données

```ts
interface Milestone {
  id: string; // [a-z0-9-]+, unique ; '@goal' est réservé (refusé par le motif)
  label: string;
  status: 'achieved' | 'planned';
  group?: string; // émetteur
  date?: string; // AAAA-MM ou AAAA-MM-JJ, mois et jour qui existent
  code?: string; // code court (code d'examen) : texte simple, 16 caractères au plus
  badge?: { src: string; width?: number; height?: number }; // achieved seulement
  href?: string; // https: absolu ou chemin relatif (page de vérification)
}
interface Goal {
  label: string;
  date?: string;
  href?: string; // jamais de badge
}
interface MilestonesData {
  milestones: Milestone[]; // 1 à 24, dans l'ordre d'affichage
  goal?: Goal;
}
```

`validateData(input)` contrôle tout à la frontière, une fois, et rend une copie propre, **dans l'ordre
fourni** : le tri par date est fait par le composant Astro, pas ici. Un défaut lève une
`MilestonesError` dont `detail` dit où il se trouve (`milestones[2].badge.src`). Jamais de repli
silencieux.

- `badge.src` : chemin relatif ou `https:`. Refusés : `javascript:`, `data:`, `blob:`, `http:`,
  `//hôte`, barre oblique inverse, espaces et caractères de contrôle (`invalid-badge`).
  `width` et `height` : entiers strictement positifs.
- Un jalon `planned` ne peut pas porter de badge (`planned-badge`) : jamais d'image qui suggère un
  niveau non obtenu. Un objectif non plus (`invalid-badge` sur `goal.badge`).
- `code` au-delà de 16 caractères, ou avec un caractère de contrôle : `invalid-code`.
- Les liens `javascript:`, `data:`, `http:` et `//hôte` sont refusés (`invalid-href`).
- Les emblèmes géométriques n'existent plus ; un champ `emblem` est ignoré comme tout champ inconnu.

Le `.wasm` rejoue la partie qui le concerne (nombre, identifiants, statuts, longueurs) ; il ne voit ni
libellé, ni date, ni code, ni lien.

Codes d'erreur : `milestone-count`, `invalid-id`, `duplicate-id`, `unknown-status`,
`length-mismatch`, `theme-length`, `theme-value`, `theme-color`, `active-index`, `unknown-id`,
`progress`, `viewport`, `geometry-size`, `gl-unavailable`, `shader-compile`, `program-link`,
`gl-resource` (ceux du `.wasm`, vérifiés par `test/wasm-codes.test.ts`), puis `invalid-data`,
`invalid-label`, `invalid-date`, `invalid-href`, `invalid-code`, `invalid-badge`, `planned-badge`,
`invalid-theme`, `unsupported-color`, `load-failed`, `not-ready`, `internal`.

## Thème

`readTheme(root)` lit la liste fermée de jetons `--pp-color-bg`, `-fg`, `-accent`, `-on-accent`,
`-line`, `-muted`, `--pp-duration-base`, `-fast` et `--pp-easing-standard`, plus `paper`.

`paper` est `--pp-color-bg` résolu en mode **clair**, quelles que soient les préférences : le support
de la médaille reste clair, même dans le thème sombre (conditions des badges, ADR-0013). La sonde
pose `color-scheme: light` sur elle-même par le CSSOM avant de lire le jeton ; `bg` suit toujours le
thème de la page. Le tableau envoyé au `.wasm` compte 34 nombres, dans l'ordre de
`crates/pp-milestones` : sept couleurs de quatre (espace, trois composantes : `bg`, `fg`, `accent`,
`on-accent`, `line`, `muted`, `paper`), les deux durées, les quatre points de la courbe.

`getPropertyValue('--pp-color-accent')` rend le texte brut `light-dark(oklch(…), oklch(…))`, pas
une couleur : une propriété personnalisée non enregistrée n'est pas calculée. Le paquet applique donc
le jeton à la propriété `color` d'un élément sonde, posé sous la racine pour hériter de
`color-scheme`, avec `transition: none` (une transition fausserait la couleur lue), puis lit la
`color` calculée. La sonde passe par le CSSOM : aucun attribut `style` dans le balisage, compatible
avec une CSP sans `unsafe-inline`. Une couleur absente lève `invalid-theme`, aucune n'est inventée.
Une durée illisible vaut 0 ms (aucune animation), une courbe non reconnue est linéaire.

### Formats de couleur pris en charge

La sérialisation d'une couleur calculée n'était pas établie par l'ADR. Relevée le 2026-11-19 dans
Chromium 156.0.8078.4, Firefox 153.0 et WebKit 27.2 (`scripts/capture-colors.mjs`, valeurs dans
`test/fixtures/computed-colors.json`) : les trois gardent l'espace d'origine.

| Écrit                                          | Chromium, Firefox                                               | WebKit                          |
| ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------- |
| `oklch(47% 0.19 270.7)` (les jetons)           | `oklch(0.47 0.19 270.7)`                                        | `oklch(0.47 0.19 270.700012)`   |
| `oklch(0.5 0.1 0.5turn)`                       | `oklch(0.5 0.1 180)`                                            | `oklch(0.5 0.1 180)`            |
| `rgb(10 20 30 / 50%)`                          | `rgba(10, 20, 30, 0.5)`                                         | `rgba(10, 20, 30, 0.5)`         |
| `#336699`, `hsl(210 50% 40%)`, `rebeccapurple` | `rgb(51, 102, 153)`, `rgb(102, 51, 153)`                        | idem                            |
| `color(srgb 0.2 0.4 0.6)`                      | `color(srgb 0.2 0.4 0.6)`                                       | idem                            |
| `lab(50% 20 30)`                               | `lab(50 20 30)`                                                 | idem                            |
| `color-mix(in oklch, …)`                       | `oklch(0.734997 0.0950249 270.7)` ou `oklch(0.735 0.095 270.7)` | `oklch(0.735 0.095 270.700012)` |

`parseColor` accepte : `rgb()` et `rgba()` (virgules ou espaces, nombres ou pourcentages),
`oklch()` et `oklab()` (nombres, pourcentages, unités `deg`, `grad`, `rad`, `turn`, `none`),
`color(srgb …)` et `color(srgb-linear …)`. L'opacité est lue puis ignorée : les jetons sont
opaques. Le reste (`lab()`, `lch()`, `color(display-p3 …)`, `color-mix()`) lève `unsupported-color`.
Le bruit de simple précision de WebKit (`270.700012`) est sans effet : le `.wasm` convertit en sRGB
et ramène dans le gamut avec `pp-color`.

## Conditions de chargement

`canEnhance(env)` est vrai si toutes les conditions de l'ADR tiennent ; `enhanceBlocker(env)` rend la
première qui échoue (`save-data`, `weak-device`, `hidden`, `no-webgl2`) ou `null`.
`enhanceEnv(visible)` fabrique l'environnement du navigateur ; tout est injectable dans les tests
(`matchMedia`, `navigator`, création d'un contexte).

| Condition       | Refus quand                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| données         | `navigator.connection.saveData === true`                                           |
| appareil faible | `hardwareConcurrency <= 2` ou `deviceMemory <= 2` (`WEAK_CORES`, `WEAK_MEMORY_GB`) |
| visibilité      | la section n'est pas visible (observateur d'intersection de l'appelant)            |
| WebGL2          | un canvas jetable ne rend pas de contexte (rendu aussitôt au navigateur)           |

**Mouvement réduit** : `prefers-reduced-motion: reduce` ne bloque plus la 3D (ADR-0013, décision 3 ;
la raison `reduced-motion` n'existe plus). `prefersReducedMotion(env)` (fonction pure, `matchMedia`
injectable) dit si la personne demande moins de mouvement, pour que le composant adapte son
pilotage : bloc de hauteur d'écran, étapes par clic, boutons et flèches, sans conteneur haut. Les
durées du thème valent déjà 0 sous mouvement réduit (jetons `--pp-duration-*`) : la caméra saute d'un
jalon à l'autre sans transition.

Une valeur absente n'est jamais une mesure. `deviceMemory` et `saveData` n'existent que sur
Chromium ; absents sur Firefox et Safari, ils ne comptent NI comme « appareil faible » NI comme
« économie de données ». Une valeur non finie, nulle ou négative est traitée comme absente. Les
contrôles sans coût passent d'abord : un contexte WebGL n'est créé que si tout le reste est admis.

## Gyroscope

Défauts tranchés : l'inclinaison au pointeur est toujours là ; le gyroscope s'y ajoute sans jamais
imposer de boîte de dialogue.

- Sans `DeviceOrientationEvent` : pas de capteur, pointeur seul.
- Sans `requestPermission` (Android, la plupart des navigateurs) : écoute immédiate. Un événement
  sans mesure (`beta` et `gamma` nuls, cas d'un ordinateur de bureau) rend la main au pointeur.
- Avec `requestPermission` (iOS) : rien n'est demandé au chargement. L'autorisation se demande au
  premier toucher sur le canvas, donc sur geste. Refusée, ou en cas d'erreur : pointeur seul, aucune
  nouvelle demande. Deux gestes rapprochés ne produisent qu'une demande.
- Angle de tenue neutre de 45° (`GYRO_REST_BETA_DEG`), amplitude de 30° pour l'inclinaison maximale
  (`GYRO_RANGE_DEG`) : conventions, pas des mesures.

## Cycle de vie

- **Rendu à la demande** : une image n'est planifiée (`requestAnimationFrame`) que quand une commande
  ou un événement change quelque chose, ou tant que `frame()` rend vrai (transition ou inclinaison en
  cours). Aucune boucle au repos. Hors écran (`IntersectionObserver`) ou onglet masqué
  (`visibilitychange`), rien n'est planifié ; au retour, une image.
- **Taille** : `ResizeObserver` ; la résolution interne suit la taille CSS (posée par la feuille de
  style), plafonnée par `dprMax`.
- **Thème** : `MutationObserver` sur `data-theme` de `:root` et `prefers-color-scheme` relisent les
  jetons et rappellent `setTheme`. Jetons illisibles à cet instant : le thème en cours reste.
- **Perte de contexte** : `preventDefault()` sur `webglcontextlost`, scène prévenue ; si
  `webglcontextrestored` n'arrive pas avant `CONTEXT_RESTORE_TIMEOUT_MS` (2 000 ms),
  `onFallback('context-lost')` puis `destroy()`. À la restauration, les ressources sont recréées.
- **`destroy()`** retire tous les écouteurs, déconnecte les observateurs, annule le minuteur et
  l'image planifiée et les chargements de badges, libère tampons, VAO et programme, puis rend le contexte au navigateur
  (`loseContext`). Idempotent. Le compte des écouteurs est testé (`test/lifecycle.test.ts`).

## Construction et mesures

Le `.wasm` n'est jamais commité : `npm run build:wasm` lance `node tools/wasm/build-milestones.ts`
(`cargo`, `wasm-bindgen` 0.2.130, puis `wasm-opt -Oz` du paquet `binaryen`). `npm run check:wasm`
vérifie l'empreinte SHA-256 enregistrée, publiée avec le paquet. Détails et comparaison de
`opt-level` : [`crates/pp-milestones-wasm`](../../crates/pp-milestones-wasm/README.md).

Poids du `.wasm` et de la glue mesurés le 2026-11-21 après l'ADR-0013 (cible : 45 Kio en brotli pour
le `.wasm`), jamais bloquants ; la ligne de l'enveloppe TypeScript date du 2026-11-19 et n'est pas
remesurée :

| Fichier                                               | brut (o) | gzip (o) | brotli (o) |
| ----------------------------------------------------- | -------: | -------: | ---------: |
| `.wasm` avant wasm-opt                                |  176 912 |   51 480 |     41 624 |
| `.wasm` après wasm-opt -Oz (livré)                    |   82 538 |   37 792 |     31 992 |
| glue JavaScript de wasm-bindgen                       |   28 403 |    6 566 |      5 833 |
| enveloppe TypeScript (`dist`, 26 fichiers concaténés) |   31 492 |    8 933 |      7 928 |

Le `.wasm` et la glue ne se chargent qu'à l'appel de `init` (import dynamique) : zéro octet de 3D
pour qui n'active pas le comportement. `@paulperigault/color` et `@paulperigault/data` ne changent
pas : leurs `.wasm` (54 205 et 58 498 octets) sont identiques octet pour octet avant et après.

## Vérification

`npm -w @paulperigault/milestones-3d test` : contrat de données (badge, code, dates, ordre conservé),
parseur de couleur avec les valeurs de trois moteurs, durées et courbes, thème avec sonde injectée
(dont `paper` en mode clair), conditions de chargement (table de cas, sans `reduced-motion`),
gyroscope, boucle, commandes et image planifiée, survol et sélection, écouteurs passifs, chargement
différé des badges avec faux `fetch` et faux `createImageBitmap` (succès, 404, rejet, annulation,
concurrence de deux), repli sur échec, perte et restauration avec un faux contexte, `destroy()`.
Le job CI `wasm` rejoue en plus les tests contre le `.wasm` construit (`PP_MILESTONES_WASM=required`).

Parcours réel de l'ADR-0012, hors dépôt, à refaire avec le lot de rendu (Playwright, rendu logiciel) sur Chromium 156, Firefox 153 et WebKit 27 :
lecture du thème, rendu, bascule clair et sombre, inclinaison au pointeur, sélection au clic, perte
puis restauration du contexte (image identique à celle d'avant la perte), repli sans restauration,
`destroy()` idempotent.

## Audit web

`task audit:milestones-3d` (brique #366, `tools/audit/milestones-3d.ts`) construit la documentation,
la sert avec les en-têtes de l'hébergeur et contrôle la page de démonstration sur Chromium 156,
Firefox 157 et WebKit 27, en rendu logiciel pour rester comparable à la CI Linux. Relevé du
2026-11-20 : 123 lignes, 109 réussies, 0 échec, 5 sautées (fuites et mesures CDP : Chromium
seulement ; brotli : WebKit n'annonce pas `br` en http local), 9 mesures.

Ce relevé précède l'ADR-0013 : les mesures et contrôles sur `prefers-reduced-motion` (liste seule)
ne valent plus, la 3D reste admise sous mouvement réduit. Contrôles sur les trois moteurs : rendu non vide, cadrage et fidélité de la teinte aux jetons, clair
et sombre, bureau et mobile ; `prefers-reduced-motion`, `saveData`, appareil faible et absence de
WebGL2 donnent la liste seule ; perte de contexte avec et sans restauration ; `destroy()` ; axe sans
violation à 360 et 1440 px, avec et sans 3D ; clavier ; contraste du panneau ; console sans erreur ni
avertissement ; aucune requête tierce ; `.wasm` en `application/wasm`, brotli, cache d'un an.

Messages de console que le navigateur émet seul (vérifiés sur une page vide) et que l'audit compte à
part : « GPU stall due to ReadPixels » (Chromium, rastériseur logiciel), « WebGL context was lost. »
(Firefox, à chaque `loseContext()` du contexte jetable relâché exprès) et « Use of the orientation
sensor is deprecated. » (Firefox, à la pose d'un écouteur `deviceorientation`).

Mesures sur Chromium, profil mobile, CPU ralenti 4 fois, 4G lente (jamais bloquantes) :

| Mesure                                        |  Sans 3D |       Avec 3D |
| --------------------------------------------- | -------: | ------------: |
| Poids transféré de la page de démonstration   | 80 435 o |     122 339 o |
| LCP (audit Playwright, `PerformanceObserver`) |   640 ms |        633 ms |
| CLS                                           |    0,000 |         0,000 |
| Première image de la scène                    |        - |        511 ms |
| Durée d'image moyenne / p95                   |        - | 16 ms / 17 ms |
| INP (clic sur un jalon)                       |        - |         56 ms |
| Instanciation du `.wasm`                      |        - |        139 ms |

Lighthouse 13.6.0, mêmes conditions, sur la même page (sans 3D : mouvement réduit ; avec 3D : scène
activée par un geste simulé) :

| Catégorie ou mesure                  | Sans 3D | Avec 3D |
| ------------------------------------ | ------: | ------: |
| Performance                          |      88 |      90 |
| Accessibilité, bonnes pratiques, SEO |     100 |     100 |
| LCP                                  |  950 ms | 1548 ms |
| CLS                                  |   0,000 |   0,000 |
| TBT                                  |  491 ms |  391 ms |

Le LCP de Lighthouse monte de 950 à 1548 ms avec la 3D, alors que l'audit Playwright ne mesure
aucun écart (640 contre 633 ms). Les protocoles diffèrent (Lighthouse active la scène dès le
chargement) et la cause de l'écart n'est pas établie. Aucune valeur n'est un seuil ; elles sont
publiées telles que mesurées.

## Adopter dans un site

Versions à consommer : `@paulperigault/milestones-3d@^0.1.0` et `@paulperigault/astro@^0.4.0`, les
premières à porter le composant. release-please les prépare dans la PR de release, que le
propriétaire fusionne ; tant qu'elle ne l'est pas, le paquet n'est pas sur npmjs et l'installation
échoue (404).

```bash
npm install @paulperigault/milestones-3d@^0.1.0 @paulperigault/astro@^0.4.0 @paulperigault/css
```

Le composant `Milestones3D` et son comportement viennent de `@paulperigault/astro` (propriétés
`milestones`, `goal`, `label`, `locale`, `labels`) ; le comportement charge ce paquet par `import()`.
Dans la page, après le composant :

```astro
<script>
  import { install } from '@paulperigault/astro/milestones-3d';
  install(document);
</script>
```

`@paulperigault/astro` déclare ce paquet en `peerDependencies` facultative (`^0.0.0`, remontée à chaque release) : npm ne
l'installe pas seul, d'où la commande ci-dessus. Importer le comportement sans le paquet échoue au
build ; ne pas l'importer laisse la liste classique seule.

Côté serveur du site : `script-src 'self' 'wasm-unsafe-eval'` et `connect-src 'self'` dans la CSP, le
`.wasm` servi en `application/wasm`. Pour l'inclinaison au gyroscope, autoriser `gyroscope` et
`accelerometer` dans la `Permissions-Policy` ; sans eux, l'inclinaison se fait au pointeur. Détails et
poids : [page du composant](https://design.paulperigault.dev/components/milestones-3d/).

## Initialisation par phases (aucune tâche longue)

`init` ne fait jamais plus d'un morceau borné de travail par tâche (audit #394) : chargement du
`.wasm`, création du contexte (`prepare`), état de la scène, puis les étapes du GPU (`gpuStep` : un
programme, un tampon par étape, la compilation parallèle attendue sans bloquer quand
`KHR_parallel_shader_compile` existe), chacune séparée de la suivante par `yieldToMain`. La boucle de
rendu commence par un préchauffage (`warmup.ts`) : canvas caché, image d'essai, clôture du GPU
interrogée à chaque image, puis le canvas est montré. Sans carte graphique, le navigateur compose le
canvas en lisant ses pixels et attend le GPU logiciel ; ce préchauffage lui laisse faire ce travail
hors du chemin visible.

Chaque phase laisse une marque `performance.measure` (`pp3d:load-wasm`, `prepare-context`,
`create-scene`, `gpu-step-N`, `resize`, `first-frame`, `texture-decode`, `texture-upload`) : l'audit
(`tools/audit/milestones-3d`) les joint à chaque tâche longue pour dire quelle phase déborde.
Rejouer une CI sans carte graphique en local : `AUDIT_CHROMIUM_FLAGS="--headless=new --disable-gpu"`.

## Provenance

Chaque version est publiée par le workflow `release` du dépôt, avec une attestation de provenance
npm. Détails :
[publication npm](https://github.com/PaulPerigault/design-system/blob/main/docs/process/publication.md).

## Licence

MIT : [LICENSE](https://github.com/PaulPerigault/design-system/blob/main/packages/milestones-3d/LICENSE)
