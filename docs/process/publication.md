# Publication npm : pré-vol à blanc et actions de Paul

Issue : [#236](https://github.com/PaulPerigault/design-system/issues/236). Mesuré le 2026-11-02, sur `main`, Node 24.18.0, npm 11.16.0. Rien n'a été publié : seuls `npm pack` (dry-run et tarballs locaux hors du dépôt), `npm install` de ces tarballs dans un projet vierge et des lectures. Aucun secret lu ni écrit.

## Les neuf paquets

`tokens`, `css`, `astro`, `dataviz`, `guards`, `create`, `mcp`, `color`, `data` (tous `@paulperigault/<nom>`, version `0.0.0`, licence MIT, `engines.node >=24`, `publishConfig` : accès public et provenance). Les issues #108 et #109 disaient cinq : corrigé dans leur corps. `release-please-config.json` et `.release-please-manifest.json` listent bien les neuf.

## Contenu des tarballs (mesure)

| Paquet    | Taille (o) | Fichiers | Notes                                                                   |
| --------- | ---------- | -------- | ----------------------------------------------------------------------- |
| `astro`   | 105 976    | 196      | 60 sources `.ts` publiées par conception (composants et comportements)  |
| `color`   | 33 935     | 23       | `.wasm` de 54 205 o, empreinte `.sha256` vérifiée (`sha256sum -c` : OK) |
| `create`  | 48 080     | 142      | gabarits du site (`templates/`, dont un `tsconfig.json` voulu)          |
| `css`     | 4 558      | 8        | polices : licences dans `LICENSES/`                                     |
| `data`    | 37 572     | 23       | `.wasm` de 58 498 o, empreinte vérifiée                                 |
| `dataviz` | 33 845     | 90       |                                                                         |
| `guards`  | 29 886     | 74       | `bin` : `pp-guards`                                                     |
| `mcp`     | 228 350    | 51       | `bin` : `pp-mcp`, données embarquées                                    |
| `tokens`  | 23 884     | 63       |                                                                         |

Aucun fichier de test, `.env`, clé, `tsconfig` du dépôt ni `node_modules` dans un tarball ; aucune source `.ts` hors `astro` (déclarations `.d.ts` seulement). Manque trouvé : aucune `LICENSE` dans les paquets (npm n'inclut que celle du dossier du paquet) : une copie identique à la licence du dépôt est ajoutée à chacun, vérifiée par test (`tools/release/license.test.mjs`).

`npm run check:pack` rejoue désormais cette vérification à chaque `verify` : un fichier interdit (secret, clé, test, source `.ts` hors `astro`, `tsconfig`, `node_modules`) **bloque** ; un `README` ou une `LICENSE` absents, ou un `.wasm` absent, **avertissent** (le `.wasm` n'existe qu'après `build:wasm` : absent du job `verify`, présent dans `release.yml`).

## Installation dans un projet vierge (hors du dépôt)

Les neuf tarballs installés ensemble (`npm install --ignore-scripts`, 289 paquets) : succès. Imports vérifiés : `tokens/color`, `contrast`, `palette`, `customize` ; `dataviz` ; `guards/design`, `guards/eslint` ; `color` ; `data` : tous chargent. Fichiers `tokens.css`, `tokens.json`, `css/base.css`, `css/theme.css`, `astro/registry.json`, `astro/Stack.astro` : présents. `pp-create create <dossier>` génère un site complet ; `pp-mcp --self-test` : ok ; `pp-guards --help` : ok. Limite normale : `@paulperigault/astro/variants` et `field-ids` sont des `.ts` qu'un `node` simple refuse sous `node_modules` (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`) ; Astro et Vite les compilent.

## `release.yml` relu

Bon : `permissions: {}` au niveau du workflow, `id-token: write` et `contents: read` seulement sur le job `publish` ; environnement protégé `npm-publish` ; actions épinglées par SHA ; `npm ci --ignore-scripts` ; `.wasm` compilés en CI (`wasm-bindgen-cli@0.2.130 --locked`) puis `check:wasm` ; `npm audit signatures` ; SBOM CycloneDX en artefact ; publication par `publish-new.mjs` avec `--provenance`, préversion sous `next`. `npm audit signatures` ne s'applique pas à nos propres paquets avant leur première publication (il vérifie les paquets installés depuis le registre) : il porte ici sur les dépendances.

## Risques trouvés

1. **Gabarits de `create` : version `0.0.0`.** `packages/create/templates/versions.json` fixe `@paulperigault/css`, `tokens`, `guards`, `mcp` à `0.0.0` et n'est mis à jour par aucun mécanisme de release. Après la première vraie version, `pp-create create` produirait un site qui dépend de la `0.0.0` d'amorce, un paquet vide. Corrigé par une synchronisation à `prepack` (D-129).
2. **Ordre de publication.** `publish-new.mjs` publie par ordre alphabétique, non par ordre de dépendances : npm ne l'exige pas (les dépendances se résolvent à l'installation), mais pendant quelques minutes un paquet est installable sans son amont.
3. **Jeton de release-please.** `release.yml` lit le secret `RELEASE_PLEASE_TOKEN` : [À VÉRIFIER] qu'il existe (lecture des secrets non faite ici).
4. **npm ≥ 11.5.1** requis pour la publication de confiance : npm 11.16.0 ici ; [À VÉRIFIER] la version fournie par l'image du workflow.

## Miroir GitHub Packages (facultatif, #130)

npmjs reste la source publique ; GitHub Packages est un miroir ajouté juste après la publication npm, pour que Paul consomme les paquets dans ses autres projets. Rien n'est publié par cette préparation.

- Déclenchement : le job `mirror` de `release.yml`, `needs: publish`, seulement si une release est créée, jamais pour une PR. Permissions du job : `contents: read` et `packages: write` ; `GITHUB_TOKEN` du workflow, aucun secret ajouté.
- Méthode : `tools/release/mirror-github-packages.mjs` télécharge le tarball déjà publié sur npmjs, réécrit son `publishConfig` (registre GitHub, accès public) et le republie sur `https://npm.pkg.github.com`. Plan pur testé (`mirror-plan.test.mjs`) ; le script refuse de tourner hors de GitHub Actions. L'échec du miroir ne touche pas la publication npm.
- Provenance : **non demandée** sur le miroir. La page de GitHub Packages lue le 2026-11-02 n'en parle pas : `[À VÉRIFIER]` avant d'ajouter `--provenance`. La provenance npm reste celle de npmjs.
- Scope : GitHub exige que le scope du paquet soit celui du propriétaire en minuscules (`@paulperigault`) : tenu, et contrôlé par le script.

Côté consommateur (documentation de GitHub, lue le 2026-11-02 : un jeton est nécessaire pour installer, même un paquet public ; seul un jeton personnel « classic » est pris en charge) :

```shell
# .npmrc du projet consommateur (ne jamais committer le jeton)
@paulperigault:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Créer le jeton sur GitHub (Settings, Developer settings, Personal access tokens (classic)) avec la seule portée `read:packages`, puis `export GITHUB_TOKEN=…` avant d'installer un paquet.

**Limite connue :** comme l'installation exige un jeton, `npx @paulperigault/create` et tout usage public passent par npmjs ; le miroir ne sert qu'aux projets de Paul. Action manuelle de Paul : aucune avant la première release (le job se déclenche seul) ; après elle, vérifier la page Packages du dépôt.

## Actions manuelles de Paul, dans l'ordre

1. Compte npm avec double authentification (`npm profile enable-2fa auth-and-writes`), sur l'organisation ou le compte qui possède le scope `@paulperigault`.
2. Vérifier le scope : `npm view @paulperigault/tokens` doit répondre `404` (rien n'est pris). Idem pour les huit autres.
3. Amorce `0.0.0` si la page de réglages du paquet n'existe pas encore : une `0.0.0` vide par paquet, **depuis un dossier hors du dépôt** (boucle sur les **neuf** noms : `docs/manual-steps.md` §3).
4. Trusted publisher, paquet par paquet (neuf), sur `https://www.npmjs.com/package/@paulperigault/<nom>/access` : organisation `PaulPerigault`, dépôt `design-system`, workflow `release.yml`, environnement `npm-publish`.
5. Vérifier le secret `RELEASE_PLEASE_TOKEN` et l'environnement `npm-publish` du dépôt.
6. Relire puis fusionner la PR de release-please (#40) : versions, changelog, `ci` verte. La fusion déclenche `release.yml`.
7. Après la publication : `npm view @paulperigault/<nom>` répond pour les neuf, la provenance est affichée, `npm audit signatures` dans un projet qui les installe.

Jamais par l'assistant : `npm publish`, `apply`, réglage de compte.
