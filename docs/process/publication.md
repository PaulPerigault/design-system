# Publication npm : pré-vol à blanc et actions de Paul

Issues : [#275](https://github.com/PaulPerigault/design-system/issues/275) (dépendances internes, 2026-11-04), [#236](https://github.com/PaulPerigault/design-system/issues/236) (mesure du 2026-11-02) et [#258](https://github.com/PaulPerigault/design-system/issues/258) (rejeu et trusted publisher du 2026-11-03). Mesuré sur `main`, Node 24.18.0, npm 11.16.0. Rien n'a été publié : seuls `npm pack` (dry-run et tarballs locaux hors du dépôt), `npm install` de ces tarballs dans un projet vierge et des lectures. Aucun secret lu ni écrit.

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
3. **Jeton de release-please.** Le secret `RELEASE_PLEASE_TOKEN` existe (liste des noms de secrets du dépôt, 2026-11-03 ; la valeur n'est pas lue).
4. **npm ≥ 11.5.1** requis pour la publication de confiance : `setup-node` installe la dernière 24.x (`.nvmrc`), npm 11.16.0 avec Node 24.18.0 ici ; déduit, [À VÉRIFIER] dans le journal du premier run.
5. **La PR de release-please (#40) proposait 1.0.0 pour les neuf paquets** (relevé le 2026-11-03), contre la règle « 0.x ». Cause : aucun tag ni release n'existe (`git tag -l` et `gh release list` vides), donc release-please applique sa version initiale par défaut, et le manifeste à 0.0.0 n'y change rien. Corrigé par `"initial-version": "0.1.0"` dans `release-please-config.json` (clé du schéma officiel : « Releases the initial library with a specified version »), avec un test (`tools/release/release-config.test.mjs`). Non rejoué ici : release-please exige un jeton GitHub. **Après la fusion de cette correction, relire #40 : elle doit annoncer 0.1.0 ; si elle affiche encore 1.0.0, ne pas la fusionner.** Vérifié le 2026-11-03 après la fusion de la correction : #40 annonce 0.1.0 pour les neuf paquets.
6. **L'environnement GitHub `npm-publish` n'existe pas** (API `environments` : `total_count` 0, 2026-11-03). Le commentaire de `release.yml` le dit créé par IaC (dépôt du portfolio, `apply` interdit à l'assistant). Sans lui, GitHub en crée un sans protection au premier run : le nom correspondrait, sans restriction de branche. À créer par Paul avant de configurer le trusted publisher (étape 4 ci-dessous).
7. **Fenêtre de deux jours** : voir la réponse ci-dessous ; configurer les trusted publishers juste avant de fusionner #40.
8. **Dépendances internes et amorce `0.0.0`** (#275, mesuré le 2026-11-04). Les contrôles de #40 échouaient tous à `npm ci --ignore-scripts` : « Missing: @paulperigault/astro@0.0.0, css@0.0.0, dataviz@0.0.0, tokens@0.0.0 from lock file ». Cause établie par un `npm ci --dry-run` sur la branche de #40 : release-please passe les neuf paquets en 0.1.0 et le plugin `node-workspace` réécrit leurs dépendances internes (exactes : `0.0.0` devient `0.1.0` dans les `package.json` et dans le verrou), mais `apps/docs` (privée, absente de `release-please-config.json`) gardait quatre dépendances `@paulperigault/*` en `0.0.0` exact. Le paquet local étant en 0.1.0, npm cherchait `0.0.0` dans le registre, où seule l'amorce vide existera. **L'hypothèse « un paquet publié dépendrait de la `0.0.0` » est réfutée pour les neuf paquets** : sur la branche de #40, leurs dépendances internes sont en 0.1.0 (`astro`, `css`, `dataviz`, `data`, `color`, `mcp`). Le seul autre emplacement de `0.0.0` était `packages/create/templates/versions.json`, déjà aligné à `prepack` (D-129).
   - **Correction** (D-151) : les quatre dépendances d'`apps/docs` valent `*`. Application privée, jamais publiée ni empaquetée : `*` est satisfait par le paquet local à n'importe quelle version (0.0.0 sur `main`, 0.1.0 sur la branche de release) sans mécanisme de mise à jour. Les paquets publiés gardent des versions exactes, tenues par le plugin. Le verrou est resynchronisé (`npm install --package-lock-only --ignore-scripts`, huit lignes). Simulation hors du dépôt : copie de `main` corrigée, neuf paquets passés en 0.1.0 comme release-please le fait (versions, dépendances internes, verrou), `apps/docs` laissée telle quelle : `npm ci --dry-run` réussit ; sur la branche réelle de #40 sans la correction, il échoue.
   - **Contrôle ajouté** (D-152) : `npm run check:pack` lit le `package.json` de chaque paquet empaqueté (`tools/release/internal-deps.mjs`) et **bloque** si une dépendance `@paulperigault/*` (dépendances, dev, peer, optionnelles) vaut `*`, `latest`, est vide, désigne un paquet hors du workspace, ne satisfait pas la version du workspace, ou vaut `0.0.0` alors que le paquet voisin n'est plus en `0.0.0`. Tant que tout est en `0.0.0` (avant la première release), `0.0.0` est cohérent et accepté. Le gabarit `templates/versions.json` est lu **après** le `pack` : `npm pack --dry-run` exécute `prepack`, qui aligne le fichier ; avant, il porte l'amorce par construction.
   - **Hors du contrôle** : `apps/docs`, qui n'est pas empaquetée. Un `*` ou un `0.0.0` y sont sans effet sur un tarball.
   - **Documentation de release-please** (lue le 2026-11-04 : [manifest-releaser.md](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md), [schéma de configuration](https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json)) : le plugin `node-workspace` « builds a graph of local node packages configured » et met à jour les dépendants d'un paquet publié ; seuls les paquets déclarés dans la configuration en font partie, ce que la mesure confirme. Elle ne dit rien des paquets privés hors configuration ni de la conservation d'un préfixe de plage (`^`) : [À VÉRIFIER] avant de passer un jour les paquets à des plages.

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

**Réponse : un trusted publisher ne peut pas être configuré avant la première publication ; l'amorce `0.0.0` publiée à la main est nécessaire.** Sources lues par WebFetch le 2026-11-03 (texte résumé, citations telles que rendues) : [Trusted publishing](https://docs.npmjs.com/trusted-publishers), [`npm trust`](https://docs.npmjs.com/cli/v11/commands/npm-trust), [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements), [schéma de release-please](https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json).

- `npm trust` : « The package you're configuring must already exist on the npm registry. »
- Trusted publishing : la configuration se fait dans « your package settings on npmjs.com » ; la page ne dit pas qu'un paquet absent du registre puisse l'avoir. Je n'ai pas pu ouvrir la page de réglages sans connexion : l'impossibilité côté interface n'est pas observée, [À VÉRIFIER] à l'étape 3.
- Fenêtre : « A newly created trusted publisher configuration must complete its first successful publish within 2 days. » Ne configurer qu'au moment de publier (étapes 6 et 7).

**Champs, par paquet** (« Navigate to your package settings on npmjs.com and find the "Trusted Publisher" section », puis GitHub Actions) :

| Champ                | Valeur          | Obligatoire |
| -------------------- | --------------- | ----------- |
| Organization or user | `PaulPerigault` | oui         |
| Repository           | `design-system` | oui         |
| Workflow filename    | `release.yml`   | oui         |
| Environment name     | `npm-publish`   | non         |

Le workflow est le nom de fichier (`.github/workflows/release.yml`, titre « Release »), l'environnement est celui du job `publish`. npm ne vérifie pas la configuration à l'enregistrement : une faute n'apparaît qu'à la publication. Prérequis : npm CLI ≥ 11.5.1, Node ≥ 22.14.0, `id-token: write` (présent). La provenance est produite sans `--provenance` ; `publish-new.mjs` le passe quand même. Provenance : dépôt public dont l'URL correspond à `repository` (vérifié : `git+https://github.com/PaulPerigault/design-system.git` dans les neuf paquets), exécuteur hébergé par GitHub. Limite : 10 trusted publishers par paquet.

Variante en ligne de commande (npm ≥ 11.15.0, ici 11.16.0 ; double authentification au niveau du compte ; jetons « bypass 2FA » et mot de passe refusés) : `npm trust github @paulperigault/<nom> --repo PaulPerigault/design-system --file release.yml --env npm-publish --allow-publish`, puis `npm trust list @paulperigault/<nom>`. Syntaxe tirée de la page `npm trust`, non exécutée (elle écrit sur le compte) : [À VÉRIFIER] sur un premier paquet.

## Actions, dans l'ordre

**Paul**

1. `npm login` (authentification web, clé de sécurité), puis `npm whoami` : `paulperigault` (aujourd'hui : `ENEEDAUTH`).
2. `npm view @paulperigault/<nom>` : `E404` pour les neuf (confirmé par Paul ; à rejouer juste avant).
3. **Amorce `0.0.0`**, depuis un dossier hors du dépôt : la boucle de `docs/manual-steps.md` §3, neuf publications avec `--access public`. La garde `prepublishOnly` n'est pas en jeu (dossier vide). L'amorce n'a ni provenance ni contenu : voulu. [À VÉRIFIER] : nombre de demandes de la clé de sécurité.
4. **Environnement GitHub** : Settings, Environments, New environment `npm-publish`, Deployment branches : Selected branches, `main`. Relecteurs facultatifs : un relecteur obligatoire fait attendre le job `publish` jusqu'à son approbation.
5. Relire #40 après la fusion de la PR de #258 : les neuf paquets en **0.1.0**, changelogs, `ci` verte. Sinon, ne pas la fusionner.
6. **Dans la même session que l'étape 7** : configurer le trusted publisher des neuf paquets (tableau ci-dessus).
7. Fusionner #40 (propriétaire). La fusion déclenche `release.yml`.
8. Après : `npm view @paulperigault/<nom>` répond 0.1.0 pour les neuf, provenance affichée sur la page du paquet ; `npm audit signatures` dans un projet qui les installe. Puis, par paquet, Publishing access : « Require two-factor authentication and disallow tokens ».

**La CI (`release.yml`, après la fusion de #40)**

1. `release-please` crée les tags et les releases GitHub.
2. Job `publish` (`environment: npm-publish`, `id-token: write`) : `npm ci --ignore-scripts`, build, `.wasm` compilés et empreinte vérifiée, `npm audit signatures` (dépendances), SBOM, puis `publish-new.mjs` : publication avec `--provenance --access public --tag latest` de chaque version absente du registre (jeton OIDC, aucun secret npm). Un échec en cours de route se rejoue : les versions déjà publiées sont sautées.
3. Job `mirror` : miroir GitHub Packages (voir plus haut).

Jamais par l'assistant : publication npm, `npm trust`, `apply`, réglage de compte.
