# @paulperigault/create

CLI pour initialiser des sites avec @paulperigault/astro, ajouter des composants, les éjecter du paquet ou les synchroniser.

## Installation

Usage via `npm create` (recommandé) :

```bash
npm create @paulperigault <dossier>
```

Ou via `npx` directement :

```bash
npx @paulperigault/create create <dossier>
npx @paulperigault/create add <élément>
npx @paulperigault/create eject <élément>
npx @paulperigault/create diff <élément>
```

## Commandes

Codes de sortie : `0` (succès), `1` (refusé), `2` (usage).

### `create <dossier>`

Initialise un site Astro minimal avec @paulperigault/astro.

```bash
npm create @paulperigault <dossier>
```

Refuse un dossier non vide.

Options :

- `--dry-run` : liste les écritures sans créer les fichiers

### `add <élément>`

Ajoute @paulperigault/astro aux dépendances du projet courant et affiche l'extrait d'import.

```bash
npx @paulperigault/create add <élément>
```

Consulte le registre du paquet pour lister les dépendances requises.

Options :

- `--dry-run` : liste les modifications sans écrire
- `--from <dossier>` : paquet hors `node_modules` (développement du design system)

### `eject <élément>`

Copie les sources du composant dans le projet et les inscrit dans `pp-ds.lock.json` pour suivi.

```bash
npx @paulperigault/create eject <élément>
```

Par défaut, copie vers `src/components/pp`.

Options :

- `--out <dossier>` : dossier cible (défaut : `src/components/pp`)
- `--force` : écrase les copies existantes et l'entrée du verrou
- `--from <dossier>` : paquet hors `node_modules`
- `--dry-run` : liste les écritures sans créer les fichiers

Crée ou met à jour `pp-ds.lock.json` :

```json
{
  "package": "@paulperigault/astro",
  "version": "1.2.3",
  "items": {
    "Stack": {
      "package": "@paulperigault/astro",
      "version": "1.2.3",
      "files": [
        {
          "source": "src/layout/Stack.astro",
          "path": "src/components/pp/layout/Stack.astro",
          "sha256": "abc123…"
        }
      ]
    }
  }
}
```

### `diff <élément>`

Compare la copie éjectée au paquet installé et affiche les divergences.

```bash
npx @paulperigault/create diff <élément>
```

Options :

- `--from <dossier>` : paquet hors `node_modules`

## Options communes

- `--dry-run` : affiche un plan d'écritures sans modifier le disque
- `--help` : affiche l'aide complète
- `--version` : affiche la version
- `--config <fichier>` : fichier de configuration (usage interne)

## Exemple

Créer un site minimal :

```bash
npm create @paulperigault my-site
cd my-site
npm install
npm run dev
```

Ajouter un composant :

```bash
npx @paulperigault/create add Stack
# Import Stack from '@paulperigault/astro/Stack';
```

Éjecter et personnaliser :

```bash
npx @paulperigault/create eject Stack
# Fichiers copiés vers src/components/pp/layout/Stack.astro
# pp-ds.lock.json mis à jour
```

Comparer après modifications :

```bash
npx @paulperigault/create diff Stack
# Affiche les changements depuis la version éjectée
```

## Architecture interne

- `commands/` : handlers pour `create`, `add`, `eject`, `diff`
- `lib/registry.mjs` : charge les métadonnées du paquet (@paulperigault/astro)
- `lib/lock.mjs` : gère `pp-ds.lock.json` pour le suivi des fichiers éjectés
- `lib/plan.mjs` : construit et exécute les plans de fichiers (avec support `--dry-run`)
- `site/template.mjs` : charge le gabarit minimal pour `create`
