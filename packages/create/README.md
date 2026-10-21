# @paulperigault/create

CLI pour créer un site Astro qui consomme le design system, ajouter des composants
`@paulperigault/astro`, les éjecter dans le projet ou les comparer au paquet.

## Utilisation

```bash
npm create @paulperigault <dossier>
npx @paulperigault/create create <dossier>
npx @paulperigault/create add <élément>
npx @paulperigault/create eject <élément>
npx @paulperigault/create diff <élément>
```

`<dossier>` seul est un raccourci de `create <dossier>`. Le nom d'un élément est celui du registre
de `@paulperigault/astro` ou son titre, sans tenir compte de la casse.

## Options

- `--dry-run` : liste les écritures sans rien écrire (`create`, `add`, `eject`)
- `--from <dossier>` : racine d'un paquet `@paulperigault/astro` hors de `node_modules`
  (`add`, `eject`, `diff`)
- `--out <dossier>` : dossier cible des copies (`eject`, défaut : `src/components/pp`)
- `--force` : écrase les copies existantes et l'entrée du verrou (`eject`)
- `-h`, `--help` : affiche l'aide
- `-v`, `--version` : affiche la version

Une option appliquée à une commande qui ne la prend pas est refusée (code `2`).

## Commandes

### `create <dossier>`

Génère un site Astro à partir du gabarit `templates/site/`. Refuse un dossier qui existe et n'est
pas vide, même avec `--force` (code `1`).

Le site généré contient :

- `package.json` avec `@paulperigault/css`, `@paulperigault/tokens` et `astro` en dépendances,
  `@paulperigault/guards`, `husky`, `@commitlint/cli` et `@commitlint/config-conventional` en
  `devDependencies`, toutes en versions exactes (`templates/versions.json`)
- les scripts `dev`, `build`, `preview`, `guard` (`pp-guards all`), `verify`
  (`npm run guard && astro build`) et `prepare` (`husky`)
- `pp-guards.config.json`, une mise en page `src/layouts/Base.astro` qui importe
  `@paulperigault/css`, et une page d'accueil
- un hook Husky `commit-msg`, la configuration commitlint, un workflow GitHub Actions
  (`npm ci --ignore-scripts` puis `npm run verify`), `.gitignore` et `.npmrc`

Les fichiers du gabarit préfixés par `_` perdent ce préfixe à l'écriture (`_gitignore` devient
`.gitignore`). Le nom du paquet npm est dérivé du nom du dossier.

Après l'écriture, la commande affiche les étapes suivantes : `cd`, `git init`, `npm install`,
`npm run dev`, `npm run verify`. Il faut commiter `package-lock.json` avant la première CI.

Codes : `0` écrit (ou plan affiché avec `--dry-run`), `1` dossier non vide ou conflit, `2` usage.

### `add <élément>`

Ajoute `@paulperigault/astro` aux `dependencies` du `package.json` du dossier courant, à la
version installée, sauf s'il figure déjà dans `dependencies` ou `devDependencies`. Affiche ensuite
un extrait d'import par fichier `.astro` de l'élément, et les éléments requis du registre :

```text
import Stack from '@paulperigault/astro/Stack.astro';
```

Un avertissement signale un import que le champ `exports` du paquet ne couvre pas.

Codes : `0` succès, `1` `package.json` absent ou inutilisable, `2` usage ou élément introuvable
dans le paquet installé.

### `eject <élément>`

Copie les sources de l'élément dans le projet : `src/layout/Stack.astro` du paquet devient
`<out>/layout/Stack.astro`. Les copies sont inscrites dans `pp-ds.lock.json` avec leur empreinte.
La commande affiche l'import de la copie, relatif à `src/`.

Sans `--force`, elle refuse un élément déjà présent dans le verrou ou un fichier cible existant.

Codes : `0` succès, `1` conflit ou verrou illisible, `2` usage, élément introuvable ou paquet
absent.

### `diff <élément>`

Compare, en lecture seule, la copie éjectée au paquet installé. L'élément doit figurer dans
`pp-ds.lock.json`. La commande affiche les versions de la copie et du paquet, puis une ligne
`<statut> <fichier>` par différence. Statuts : `ajouté`, `supprimé`, `modifié`, avec l'origine
`(local)`, `(paquet)` ou `(local, paquet)` quand l'empreinte du verrou permet de la déterminer.

Codes : `0` identique, `1` différences, `2` usage ou élément non éjecté.

## `pp-ds.lock.json`

Créé à la racine du projet par `eject`, trié par nom, indenté de 2 espaces. `items` est indexé par
le `name` de l'élément dans le registre, en minuscules. Chaque fichier garde son chemin source
dans le paquet, son chemin de copie et l'empreinte SHA-256 du contenu copié.

```json
{
  "lockfileVersion": 1,
  "items": {
    "stack": {
      "package": "@paulperigault/astro",
      "version": "1.2.3",
      "files": [
        {
          "source": "src/layout/Stack.astro",
          "path": "src/components/pp/layout/Stack.astro",
          "sha256": "…"
        }
      ]
    }
  }
}
```

Une `lockfileVersion` autre que `1` est refusée.

## Exemple

```bash
npm create @paulperigault mon-site
cd mon-site
git init
npm install
npm run dev
```

Éjecter puis comparer :

```bash
npx @paulperigault/create eject stack
npx @paulperigault/create diff stack
```
