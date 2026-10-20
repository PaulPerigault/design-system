# Site Astro

Site statique généré par `@paulperigault/create`, consommateur du design system @paulperigault
(`@paulperigault/css` pour les styles, `@paulperigault/guards` pour les contrôles).

## Démarrage

```sh
git init
npm install
npm run dev
npm run verify
```

`git init` précède `npm install` : le script `prepare` installe le hook `commit-msg` de husky, qui
a besoin d'un dépôt git.

- `npm run dev` : serveur de développement Astro.
- `npm run guard` : contrôles `pp-guards all`, réglés dans `pp-guards.config.json`.
- `npm run verify` : `npm run guard`, puis `astro build`.

## Avant la première CI

La CI (`.github/workflows/ci.yml`) lance `npm ci --ignore-scripts` (aucun script de cycle de vie
des dépendances, ni `prepare`), qui échoue sans `package-lock.json`. Commitez le
lockfile produit par le premier `npm install` avant de pousser :

```sh
git add package-lock.json
git commit -m "chore: add lockfile"
```

## Commits

Conventional Commits, sujet en minuscules de 72 caractères au plus. Les lignes `Co-authored-by` et
les mentions « Generated with » sont refusées, sans exemption (`commitlint.config.mjs`).

## Dépendances

`.npmrc` fixe le registre npmjs, enregistre des versions exactes (`save-exact`) et refuse une
version de Node hors de `engines` (`engine-strict`, Node 24 ou plus).
