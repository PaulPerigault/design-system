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

Contrôles : `tokens`, `design`, `size`, `layers`, `images`, et `all`.

Codes de sortie : `0` (succès), `1` (problèmes détectés), `2` (usage ou configuration).

Les racines à parcourir sont des **positionnels** : `pp-guards design src apps`. Elles remplacent
la clé `roots` du fichier de configuration. Chaque contrôle accepte aussi `--config <fichier>`
(défaut : `pp-guards.config.json`) et `--help`.

Ordre de priorité des options : défauts du contrôle, section du fichier de configuration,
drapeaux, puis positionnels pour les racines. Un tableau remplace le précédent, il ne s'y ajoute pas.

### `tokens`

Vérifie que chaque `var(--pp-…)` désigne un token de `tokens.json` ou une propriété `--pp-*`
déclarée dans les sources scannées. Une référence inconnue est une erreur (code `1`). Les tokens
jamais utilisés sont signalés par un avertissement qui ne change pas le code de sortie. Ce
contrôle ne cherche pas les valeurs brutes : c'est le rôle de `design`.

Fichiers scannés : `.astro`, `.css`, `.ts`, `.mjs`, hors `node_modules`, `dist` et `generated`.

```bash
pp-guards tokens --tokens node_modules/@paulperigault/tokens/generated/tokens.json src
```

- `--tokens <chemin>` : fichier `tokens.json` (obligatoire, clé `tokens` de la section)
- au moins une racine, en positionnel ou par `roots` dans la configuration

Sans l'un des deux, le contrôle s'arrête avec le code `2`.

### `design`

Applique les interdits « anti-IA » d'AGENTS.md.

```bash
pp-guards design [options] [racines…]
```

- `--roots <dossier>` (répétable) : racines, autre forme des positionnels (défaut : `src`)
- `--extensions <ext>` (répétable) : défaut `.astro`, `.css`, `.html`, `.md`, `.mdx`, `.jsx`, `.tsx`
- `--allow <chemin>` (répétable) : exempte le chemin de toutes les règles
- `--disable <règle>` (répétable) : désactive une règle partout

Règles : `gradient`, `shadow`, `blur`, `emoji`, `spaced-caps`, `tailwind-palette`,
`arbitrary-value`, `color-literal`, `retro-effect`, `generic-phrase`, `physical-property`. Un
identifiant inconnu dans
`--disable` ou dans `allow[].rules` donne le code `2`.

Portée selon l'extension :

- `.css` et blocs `<style>` : déclarations CSS (dégradés, ombres, flou, `color-literal`,
  `retro-effect`, majuscules espacées, `physical-property`)
- `.astro`, `.html`, `.jsx`, `.tsx` : attributs `class`, `className`, `class:list`
  (classes utilitaires) en plus des blocs `<style>`
- tous les fichiers, `.md` et `.mdx` compris : `emoji` et `generic-phrase`

`physical-property` refuse les déclarations physiques (`margin-left`, `width`, `top`,
`border-right`, `overflow-x`, `text-align: left`…) au profit des propriétés logiques
(`margin-inline-start`, `inline-size`, `inset-block-start`…), qui suivent le sens d'écriture. Les
conditions `@media` et `@container` ne sont pas visées.

`color-literal` vise les valeurs CSS : notations hexadécimales, fonctions de couleur (`rgb()`,
`oklch()`…) et noms de couleur dans les propriétés de couleur. La police mono n'est pas visée :
l'ADR-0002 la permet pour le code, les identifiants, les empreintes et les journaux.

Les listes exactes (phrases génériques, couleurs nommées, motifs de classes) sont dans
`src/design/*.mjs`.

Dans le fichier de configuration, `allow` accepte aussi des objets, que la ligne de commande ne
sait pas exprimer :

```json
{
  "path": "packages/tokens/generated",
  "rules": ["color-literal"],
  "reason": "tokens.css est généré depuis la source DTCG"
}
```

- `path` (obligatoire) : chemin POSIX exempté
- `rules` (facultatif) : règles exemptées, toutes si absent
- `reason` (facultatif) : justification

### `size`

Refuse les fichiers qui dépassent un nombre de lignes. Un saut de ligne final n'est pas compté.

```bash
pp-guards size [options] [racines…]
```

- `--max <nombre>` : entier positif (défaut : `120`)
- `--ext <ext>` (répétable) : défaut `.ts`, `.astro`, `.css`, `.mjs` (clé `extensions` en configuration)

Racines par défaut : `src`.

### `layers`

Vérifie le sens des imports entre couches. Les couches sont listées **de la plus basse à la plus
haute** ; un fichier ne peut pas importer une couche plus haute que la sienne. Une couche a :

- `name` : identifiant unique
- `paths` : dossiers de la couche (obligatoire, non vide)
- `packages` : noms de paquets npm qui désignent la couche (facultatif)

Un import relatif est rattaché à une couche par son chemin, un import de paquet par `packages`.
Si aucun fichier scanné n'appartient à une couche, le contrôle échoue : `layers[].paths` est
probablement faux.

```bash
pp-guards layers [racines…]
```

Pas de drapeau propre : la liste `layers` se règle dans la configuration. Les clés `roots`
(défaut : `.`) et `extensions` (défaut : `.ts`, `.mjs`, `.js`, `.astro`, `.css`) sont facultatives.

### `images`

```bash
pp-guards images [options] [racines…]
```

- `--allow <chemin>` (répétable) : où le balisage brut est permis (défaut : `src/media`)
- `--maxKb <nombre>` : budget par fichier, en Ko (défaut : `500`, 1 Ko = 1024 octets)
- `--budgets <json>` : budgets par chemin, par exemple `'[{"path":"public/hero","maxKb":800}]'`

Racines par défaut : `src` et `public`. Trois vérifications :

- Balisage : `<img>` brut (`.astro`, `.html`, `.md`, `.mdx`, `.jsx`, `.tsx`) et
  `background` ou `background-image` avec `url(` (`.css`, `.astro`) sont refusés hors de `allow`.
  `<Image>`, `<Picture>` et le `src: url()` d'une police ne sont pas visés.
- Métadonnées : les JPEG et PNG qui contiennent des données EXIF, GPS ou XMP sont refusés. Le
  message propose `exiftool -all= -overwrite_original "<fichier>"`. Les autres formats ne sont pas
  analysés.
- Poids : `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif` et `.svg` ne dépassent pas `maxKb`. Dans
  `budgets`, l'entrée dont le `path` est le plus long l'emporte sur `maxKb`.

### `all`

```bash
pp-guards all [--config <fichier>]
```

Exécute dans l'ordre `tokens`, `design`, `size`, `layers`, `images`, mais seulement ceux dont la
section existe dans la configuration. Le code de sortie est le plus élevé des codes obtenus. Aucune
section : code `2`. Les positionnels et les autres drapeaux ne sont pas acceptés.

## Configuration

Fichier par défaut : `pp-guards.config.json` à la racine du projet. Une clé par contrôle, avec les
mêmes noms que les drapeaux (`maxKb`, `budgets`, `allow`…) et `roots` pour les racines.

```json
{
  "tokens": {
    "tokens": "packages/tokens/generated/tokens.json",
    "roots": ["packages/css/src", "packages/astro/src"]
  },
  "design": { "roots": ["packages", "apps"] },
  "size": { "roots": ["packages", "apps"], "max": 120 },
  "layers": {
    "layers": [
      { "name": "tokens", "paths": ["packages/tokens/src"], "packages": ["@paulperigault/tokens"] },
      { "name": "css", "paths": ["packages/css/src"], "packages": ["@paulperigault/css"] }
    ]
  },
  "images": { "roots": ["packages", "apps"], "allow": ["src/media"], "maxKb": 500 }
}
```

## Branchement dans `verify`

Un script `guard` lance tous les contrôles, et `verify` l'appelle, comme dans le site généré par
`@paulperigault/create` :

```json
{
  "scripts": {
    "guard": "pp-guards all",
    "verify": "npm run guard && astro build"
  }
}
```

## Configuration ESLint

Les seuils de conception (fonction de 40 lignes au plus, complexité 8, profondeur 3, 4 paramètres,
3 callbacks imbriqués, pas de nombre magique) sont exportés pour ESLint. Le sous-chemin
`@paulperigault/guards/eslint` dépend d'un export déclaré dans `package.json` par l'orchestrateur.

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';
import { designConfig } from '@paulperigault/guards/eslint';

export default tseslint.config(...tseslint.configs.recommended, ...designConfig());
```

- `designRules` : objet de règles, à fusionner dans une configuration existante
- `testRelaxations` : règles désactivées pour les tests (`max-lines-per-function`,
  `max-nested-callbacks`, `@typescript-eslint/no-magic-numbers`)
- `designConfig({ testFiles })` : tableau de deux éléments de configuration plate, `designRules`
  puis `testRelaxations` limité à `testFiles` (défaut : `**/*.test.{ts,mjs,js}`,
  `**/test/**/*.ts`, `**/e2e/**/*.ts`)

La règle `@typescript-eslint/no-magic-numbers` demande que le greffon `typescript-eslint` soit
chargé par le projet : ce paquet n'a aucune dépendance d'exécution.
