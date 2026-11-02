# Mises à jour, LTS et calendrier de montées

Issue : [#239](https://github.com/PaulPerigault/design-system/issues/239). Vérifié le 2026-11-02 sur des sources officielles lues ce jour-là (liste en fin de page). Niveau de preuve : une date de support lue dans une source officielle est « prouvée » pour cette source ; une recommandation est une préférence.

## État vérifié

| Brique           | Version du dépôt               | Support (source)                                                                                                                                                               | Verdict                                              |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Node             | 24 (`.nvmrc`, `engines`)       | v24 : LTS depuis 2025-10-28, maintenance depuis 2026-10-20, fin 2028-04-30. v26 : LTS depuis 2026-10-28, fin 2029-04-30. v22 : fin 2027-04-30. v20 : fin 2026-04-30 (dépassée) | tient ; Node 26 est la prochaine cible               |
| Astro            | 7.4.1 (7.4.5 existe)           | Astro suit les LTS Node actif et maintenance ; une seule majeure précédente reçoit des correctifs de sécurité ; aucune cadence fixe publiée                                    | tient ; patchs par Dependabot                        |
| TypeScript       | 6.0.3 (`~6.0.3`)               | 7.0.2 publié ; pas d'API programmatique en 7.0 (une nouvelle API annoncée pour 7.1)                                                                                            | attendre (voir ci-dessous)                           |
| Rust             | 1.99.1 (`rust-toolchain.toml`) | 1.99.1 (2026-10-15) est la dernière stable de `RELEASES.md` au 2026-11-02                                                                                                      | à jour                                               |
| Cloudflare Pages | image de build à vérifier      | image v3 : Node 22.23.4 par défaut, remplacé par `.nvmrc` ou `NODE_VERSION` ; images v1 et v2 migrées vers v3 le 2026-09-15 et le 2027-02-23                                   | `.nvmrc` (24) prime ; [À VÉRIFIER] l'image du projet |

Aucun changement de `engines`, `.nvmrc` ni de la matrice CI n'est nécessaire : le dépôt vise la version la plus basse supportée (24, en maintenance jusqu'à 2028-04-30), le workflow lit `.nvmrc`, et il n'y a pas de matrice de versions.

## Calendrier de montées

| Quand                 | Action                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| en continu            | mineures et correctifs par Dependabot (délai de 3 jours, 7 pour une majeure) ; CI verte exigée                        |
| toutes les 6 semaines | Rust : relire `RELEASES.md`, monter `rust-toolchain.toml` d'une stable (cargo `audit` et `deny` verts)                |
| chaque trimestre      | relire les dates de support ci-dessus ; mettre à jour ce fichier                                                      |
| avant 2027-04         | décider le passage à Node 26 : `.nvmrc` à 26, `engines` inchangé (`>=24`), un essai en branche (build, tests, `site`) |
| avant 2028-04-30      | Node 24 hors support : la montée à 26 doit être faite                                                                 |
| à la sortie de TS 7.1 | réévaluer TypeScript 7 (API, typescript-eslint, `astro check`)                                                        |

## Règle : changelog lu avant toute majeure

1. Lire les notes de version de **chaque** majeure sautée, pas seulement la dernière ; noter les ruptures et le minimum de Node.
2. Chercher dans le dépôt ce que chaque rupture touche (`rg`) ; écrire le résultat dans le D-xxx de la PR.
3. Une majeure à faible risque (aucune rupture qui touche le dépôt) se monte seule, avec CI verte. Sinon : étude dans ce fichier, décision de Paul.
4. Un changelog illisible ou absent : la majeure attend, `[À VÉRIFIER]`.

## Majeures en attente (2026-11-02)

**commitlint 21 et lint-staged 17 : appliqués** (D-130). commitlint 21 : minimum Node 22, option `--legacy-output`. lint-staged 17 : Node 20 abandonné, Git 2.32 minimum, `yaml` optionnel, `git update-index --again`. Aucune rupture ne touche le dépôt (JSON dans `package.json`, Node 24, Git 2.45).

**TypeScript 7 : à l'étude, non appliqué.** Compilateur natif, annoncé environ 10 fois plus rapide. Ruptures annoncées : `strict` vrai par défaut, `types` vaut `[]` par défaut, `rootDir` vaut `./`, `module` vaut `esnext`, `moduleResolution` `node`/`node10` supprimé, `baseUrl` supprimé, `target es5` supprimé, `tsc` refuse des chemins de fichiers quand un `tsconfig.json` existe sans `--ignoreConfig`. Surtout : **aucune API programmatique en 7.0**, annoncée pour 7.1 ; les outils qui importent `typescript` (typescript-eslint, `astro check`, Vue, MDX, Astro) « ne pourront probablement pas encore l'utiliser » ; contournement officiel : l'alias `@typescript/typescript6`. Effort : moyen à élevé (tsconfig de chaque paquet, double installation). Recommandation : **attendre 7.1**, puis essayer en branche avec l'alias pour les outils. Décision dans `tmp/questions-paul.md`.

**Vitest 5 : à l'étude, non appliqué.** Minimum Node 22 et Vite 6.4 (tenu). Ruptures annoncées : les projets en ligne étendent désormais la configuration racine par défaut, plus de recherche de configuration dans les dossiers parents, séparateur `>` pour `-t`, changements de couverture (`include` et `exclude`, `thresholds.perFile`). Le dépôt a une configuration racine à projets (`packages/*`, `tools`, `docs`) : la première rupture le touche. Les notes publiées donnent des titres sans pas de migration. Effort : moyen. Recommandation : essayer en branche quand le guide de migration est lu ; hors faible risque donc pas appliqué ici.

## Sources (lues le 2026-11-02)

| Source                                              | URL                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Calendrier des versions de Node                     | https://raw.githubusercontent.com/nodejs/Release/main/schedule.json  |
| Astro, mise à jour et politique de support          | https://docs.astro.build/en/upgrade-astro/                           |
| TypeScript 7.0                                      | https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ |
| Rust, notes de version                              | https://raw.githubusercontent.com/rust-lang/rust/master/RELEASES.md  |
| Cloudflare Pages, image de build                    | https://developers.cloudflare.com/pages/configuration/build-image/   |
| commitlint, notes de version                        | https://github.com/conventional-changelog/commitlint/releases        |
| lint-staged, notes de version (17.0.0 et suivantes) | https://github.com/lint-staged/lint-staged/releases                  |
| Vitest 5.0.0, notes de version (titres seuls)       | https://github.com/vitest-dev/vitest/releases/tag/v5.0.0             |
