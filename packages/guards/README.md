# @paulperigault/guards

Contrôles de conception et d'architecture du design system, sans dépendance d'exécution.

## Installation

```bash
npm i -D @paulperigault/guards
```

## Commande

```bash
pp-guards <contrôle> [options] [racines…]
```

Codes de sortie : `0` (succès), `1` (problèmes détectés), `2` (usage ou configuration).

### Contrôles disponibles

#### `tokens`

Vérifie que les valeurs de tokens sont utilisées en lieu et place des valeurs brutes.

```bash
pp-guards tokens --tokens <tokens.json> [racines…]
```

Options :

- `--tokens <chemin>` (obligatoire) : fichier `tokens.json` source
- `[racines…]` : répertoires à scanner (obligatoire, au moins un)

#### `design`

Applique les interdits de conception d'AGENTS.md : dégradés, ombres, flou, emoji, palette Tailwind par défaut, valeurs arbitraires, couleurs brutes, effets rétro, phrases génériques. Règles contrôlées :

- `gradient` : dégradés décoratifs interdits
- `shadow` : ombres décoratives interdites
- `blur` : flou interdit
- `emoji` : emoji interdit
- `spaced-caps` : majuscules espacées interdites
- `tailwind-palette` : palette Tailwind par défaut interdite, utiliser les tokens `--pp-*`
- `arbitrary-value` : valeur arbitraire interdite, utiliser un token
- `color-literal` : couleur brute interdite, utiliser un token `--pp-*`
- `retro-effect` : effet rétro interdit (glitch, machine à écrire, scanlines)
- `generic-phrase` : phrase générique interdite

```bash
pp-guards design [options] [racines…]
```

Options :

- `--roots <dossier>` (répétable) : répertoires à scanner (défaut : `src`)
- `--extensions <ext>` (répétable) : extensions de fichier (défaut : `.astro`, `.css`, `.html`, `.md`, `.mdx`, `.jsx`, `.tsx`)
- `--disable <règle>` (répétable) : règles à désactiver par identifiant
- `--allow <chemin>` (répétable) : chemin ou objet JSON `{ "path": "", "rules": [""] }` ; exempte du contrôle
- `--config <fichier>` : configuration (défaut : `pp-guards.config.json`)

#### `size`

Limite la taille des fichiers (par défaut 120 lignes) pour favoriser la cohésion et la maintenabilité.

```bash
pp-guards size [options] [racines…]
```

Options :

- `--roots <dossier>` (répétable) : répertoires à scanner (défaut : `src`)
- `--extensions <ext>` (répétable) : extensions de fichier (défaut : `.ts`, `.astro`, `.css`, `.mjs`)
- `--max <nombre>` : limite de lignes
- `--config <fichier>` : configuration

#### `layers`

Vérifie l'ordre des dépendances entre couches : `tokens ← css ← astro`.

```bash
pp-guards layers [options]
```

Options :

- `--config <fichier>` : configuration

#### `images`

Contrôle le répertoire des images (pas de `.svg` inline en dehors de `src/media`).

```bash
pp-guards images [options] [racines…]
```

Options :

- `--roots <dossier>` (répétable) : répertoires à scanner (défaut : `src`)
- `--allow <chemin>` (répétable) : chemins exemptés
- `--config <fichier>` : configuration

### Tout vérifier

```bash
pp-guards all
```

Exécute `tokens`, `design`, `size`, `layers`, `images` dans cet ordre. Les sections correspondantes doivent exister dans la configuration.

## Configuration

Fichier par défaut : `pp-guards.config.json` à la racine du projet.

```json
{
  "tokens": {
    "tokens": "packages/tokens/generated/tokens.json",
    "roots": ["packages/css/src", "packages/astro/src"]
  },
  "design": {
    "roots": ["packages", "apps"],
    "allow": [
      {
        "path": "packages/tokens/generated",
        "rules": ["color-literal"],
        "reason": "tokens.css est généré"
      }
    ]
  },
  "size": {
    "roots": ["packages", "apps"],
    "max": 120,
    "extensions": [".ts", ".astro", ".css", ".mjs"]
  },
  "layers": {
    "layers": [
      {
        "name": "tokens",
        "paths": ["packages/tokens/src"],
        "packages": ["@paulperigault/tokens"]
      }
    ]
  },
  "images": {
    "roots": ["packages", "apps"],
    "allow": ["src/media"]
  }
}
```

### Liste blanche

Sections `allow` : chaque entrée exempte un chemin ou un motif d'une ou plusieurs règles.

```json
{
  "path": "packages/tokens/generated",
  "rules": ["color-literal"],
  "reason": "tokens.css est généré depuis la source DTCG"
}
```

- `path` (chaîne) : motif POSIX
- `rules` (tableau, optionnel) : identifiants des règles exemptées (toutes si absent)
- `reason` (chaîne, optionnel) : justification

## Intégration dans `verify`

Ajouter à `package.json` :

```json
{
  "scripts": {
    "verify": "npm run guards && npm run lint && npm run format && npm test"
  }
}
```

Ou pour tout vérifier à la fois :

```bash
npm run guards -- all
```

## Configuration ESLint

Importer les règles de conception dans `eslint.config.mjs` :

```javascript
import { designConfig } from '@paulperigault/guards/eslint';
import tsPlugin from 'typescript-eslint';

export default [
  ...designConfig({ testFiles: ['**/*.test.ts'] }),
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsPlugin.parser },
    plugins: { '@typescript-eslint': tsPlugin.plugin },
  },
];
```

Le module `eslint.mjs` exporte :

- `designRules` : objet des règles pour consumption directe
- `designConfig(options)` : fonction générant une config plate (suppose `typescript-eslint` chargé par le consommateur)

La règle `@typescript-eslint/no-magic-numbers` suppose le greffon `typescript-eslint` chargé.
