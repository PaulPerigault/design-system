# @paulperigault/milestones-3d

Scène 3D de jalons en WebGL2 : des médailles pleines pour les jalons atteints, du fil de fer pour les
jalons prévus, le long d'un ruban en perspective. Le rendu est écrit en Rust (`crates/pp-milestones`
et `crates/pp-milestones-wasm`, compilés en WebAssembly) ; ce paquet est l'enveloppe TypeScript
stricte qui valide les données, lit le thème dans la page, décide si la 3D est admise, charge le
`.wasm` et relaie les événements. Aucun rendu en TypeScript, aucune dépendance d'exécution.

La 3D n'est qu'une amélioration : la liste HTML complète reste la source de vérité (brique #363,
composant Astro `Milestones3D`). Décisions : ADR-0012, chantier #360, brique #362.

Publié sur npmjs, série `0.x` : l'API peut changer d'une version à l'autre.

## Installation

```bash
npm install @paulperigault/milestones-3d
```

Navigateur avec WebGL2 et WebAssembly. Sous CSP : `'wasm-unsafe-eval'` dans `script-src` et
`'self'` dans `connect-src` (pour charger le `.wasm`). Sans eux, `init` rejette avec `load-failed`
et le repli classique s'applique.

## Usage

```ts
import { canEnhance, enhanceEnv, init, readTheme } from '@paulperigault/milestones-3d';

if (canEnhance(enhanceEnv(sectionIsVisible))) {
  const handle = await init(canvas, data, readTheme(document.documentElement), {
    onSelect: (id) => showPanel(id),
    onFallback: (reason) => showClassicList(reason),
  });
  handle.setActive('aws-saa'); // depuis le sélecteur HTML
  handle.setTheme(readTheme(document.documentElement));
  handle.destroy();
}
```

`init(canvas, data, theme, options?)` rend `Promise<{ destroy(), setTheme(theme), setActive(id) }>`.
Elle valide `data`, charge le `.wasm` une seule fois, crée la scène, branche les écouteurs et
demande la première image. Un échec appelle `options.onFallback(raison)`, libère tout ce qui a été
créé, puis rejette avec une `MilestonesError`.

| Option       | Défaut                          | Rôle                                                             |
| ------------ | ------------------------------- | ---------------------------------------------------------------- |
| `dprMax`     | 2                               | plafond du rapport de pixels                                     |
| `activeId`   | le premier jalon                | jalon actif au départ                                            |
| `onSelect`   | aucun                           | jalon choisi sur le canvas (clic ou toucher)                     |
| `onFallback` | aucun                           | repli vers le rendu classique, avec la raison                    |
| `themeRoot`  | parent du canvas, sinon `:root` | élément sous lequel les jetons sont lus (et relus au changement) |
| `gyroscope`  | `true`                          | inclinaison au gyroscope, demandée sur geste là où il le faut    |

Après `destroy()`, `setTheme` et `setActive` ne font rien : un nettoyage tardif ne lève pas.

## Données

```ts
interface Milestone {
  id: string; // [a-z0-9-]+, unique
  label: string;
  status: 'achieved' | 'planned';
  group?: string;
  date?: string; // AAAA-MM ou AAAA-MM-JJ, mois et jour qui existent
  href?: string; // https: absolu ou chemin relatif
  emblem?: 'disc' | 'check' | 'shield' | 'cloud' | 'network' | 'database' | 'code' | 'key' | 'gear';
}
interface MilestonesData {
  milestones: Milestone[]; // 1 à 24
  goal?: { label: string; href?: string };
}
```

`validateData(input)` contrôle tout à la frontière, une fois, et rend une copie propre. Un défaut
lève une `MilestonesError` dont `detail` dit où il se trouve (`milestones[2].date`). Jamais de
repli silencieux : une clé d'emblème inconnue est une erreur, une clé absente donne `disc`. Les
liens `javascript:`, `data:`, `http:` et `//hôte` sont refusés. Le `.wasm` rejoue la partie qui le
concerne (nombre, identifiants, statuts, emblèmes) ; il ne voit ni libellé, ni date, ni lien.

Codes d'erreur : `milestone-count`, `invalid-id`, `duplicate-id`, `unknown-status`,
`unknown-emblem`, `length-mismatch`, `theme-length`, `theme-value`, `theme-color`, `active-index`,
`viewport`, `geometry-size`, `gl-unavailable`, `shader-compile`, `program-link`, `gl-resource`
(ceux du `.wasm`, vérifiés par `test/wasm-codes.test.ts`), puis `invalid-data`, `invalid-label`,
`invalid-date`, `invalid-href`, `invalid-theme`, `unsupported-color`, `load-failed`, `not-ready`,
`internal`.

## Thème

`readTheme(root)` lit la liste fermée de jetons `--pp-color-bg`, `-fg`, `-accent`, `-on-accent`,
`-line`, `-muted`, `--pp-duration-base`, `-fast` et `--pp-easing-standard`.

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
première qui échoue (`reduced-motion`, `save-data`, `weak-device`, `hidden`, `no-webgl2`) ou `null`.
`enhanceEnv(visible)` fabrique l'environnement du navigateur ; tout est injectable dans les tests
(`matchMedia`, `navigator`, création d'un contexte).

| Condition       | Refus quand                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| mouvement       | `prefers-reduced-motion: reduce`                                                   |
| données         | `navigator.connection.saveData === true`                                           |
| appareil faible | `hardwareConcurrency <= 2` ou `deviceMemory <= 2` (`WEAK_CORES`, `WEAK_MEMORY_GB`) |
| visibilité      | la section n'est pas visible (observateur d'intersection de l'appelant)            |
| WebGL2          | un canvas jetable ne rend pas de contexte (rendu aussitôt au navigateur)           |

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

- **Rendu à la demande** : une image n'est planifiée (`requestAnimationFrame`) que quand quelque
  chose change ou bouge. Aucune boucle au repos. Hors écran (`IntersectionObserver`) ou onglet masqué
  (`visibilitychange`), rien n'est planifié ; au retour, une image.
- **Taille** : `ResizeObserver` ; la résolution interne suit la taille CSS (posée par la feuille de
  style), plafonnée par `dprMax`.
- **Thème** : `MutationObserver` sur `data-theme` de `:root` et `prefers-color-scheme` relisent les
  jetons et rappellent `setTheme`. Jetons illisibles à cet instant : le thème en cours reste.
- **Perte de contexte** : `preventDefault()` sur `webglcontextlost`, scène prévenue ; si
  `webglcontextrestored` n'arrive pas avant `CONTEXT_RESTORE_TIMEOUT_MS` (2 000 ms),
  `onFallback('context-lost')` puis `destroy()`. À la restauration, les ressources sont recréées.
- **`destroy()`** retire tous les écouteurs, déconnecte les observateurs, annule le minuteur et
  l'image planifiée, libère tampons, VAO et programme, puis rend le contexte au navigateur
  (`loseContext`). Idempotent. Le compte des écouteurs est testé (`test/lifecycle.test.ts`).

## Construction et mesures

Le `.wasm` n'est jamais commité : `npm run build:wasm` lance `node tools/wasm/build-milestones.ts`
(`cargo`, `wasm-bindgen` 0.2.130, puis `wasm-opt -Oz` du paquet `binaryen`). `npm run check:wasm`
vérifie l'empreinte SHA-256 enregistrée, publiée avec le paquet. Détails et comparaison de
`opt-level` : [`crates/pp-milestones-wasm`](../../crates/pp-milestones-wasm/README.md).

Poids mesurés le 2026-11-19, jamais bloquants (cible de l'ADR : 60 Kio en brotli pour le `.wasm`) :

| Fichier                                               | brut (o) | gzip (o) | brotli (o) |
| ----------------------------------------------------- | -------: | -------: | ---------: |
| `.wasm` avant wasm-opt                                |  148 755 |   44 484 |     36 264 |
| `.wasm` après wasm-opt -Oz (livré)                    |   70 857 |   32 976 |     28 076 |
| glue JavaScript de wasm-bindgen                       |   23 810 |    5 511 |      4 887 |
| enveloppe TypeScript (`dist`, 26 fichiers concaténés) |   31 492 |    8 933 |      7 928 |

Le `.wasm` et la glue ne se chargent qu'à l'appel de `init` (import dynamique) : zéro octet de 3D
pour qui n'active pas le comportement. `@paulperigault/color` et `@paulperigault/data` ne changent
pas : leurs `.wasm` (54 205 et 58 498 octets) sont identiques octet pour octet avant et après.

## Vérification

`npm -w @paulperigault/milestones-3d test` : contrat de données, parseur de couleur avec les valeurs
de trois moteurs, durées et courbes, thème avec sonde injectée, conditions de chargement (table de
cas), gyroscope, boucle, repli sur échec, perte et restauration avec un faux contexte, `destroy()`.
Le job CI `wasm` rejoue en plus les tests contre le `.wasm` construit (`PP_MILESTONES_WASM=required`).

Parcours réel hors dépôt (Playwright, rendu logiciel) sur Chromium 156, Firefox 153 et WebKit 27 :
lecture du thème, rendu, bascule clair et sombre, inclinaison au pointeur, sélection au clic, perte
puis restauration du contexte (image identique à celle d'avant la perte), repli sans restauration,
`destroy()` idempotent. L'audit complet est la brique #366.

## Provenance

Chaque version est publiée par le workflow `release` du dépôt, avec une attestation de provenance
npm. Détails :
[publication npm](https://github.com/PaulPerigault/design-system/blob/main/docs/process/publication.md).

## Licence

MIT : [LICENSE](https://github.com/PaulPerigault/design-system/blob/main/packages/milestones-3d/LICENSE)
