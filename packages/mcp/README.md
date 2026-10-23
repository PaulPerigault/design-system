# @paulperigault/mcp

Serveur MCP (Model Context Protocol) du design system @paulperigault. Il donne à un assistant
les fiches des composants, les jetons `--pp-*`, un calcul de contraste, les garde-fous du
système et les décisions d'architecture. Transport stdio, lecture seule, hors ligne.

Node 24 ou plus récent.

## Installation

Aucune installation préalable : l'éditeur lance le serveur avec `npx -y @paulperigault/mcp`.
Pour vérifier le paquet en local :

```sh
npx -y @paulperigault/mcp --self-test
```

La commande appelle chaque outil avec un exemple, écrit `pp-mcp : ok` sur stderr et sort avec
le code 0.

## Configuration

### Claude Code

Fichier `.mcp.json` à la racine du projet :

```json
{
  "mcpServers": {
    "paulperigault-ds": {
      "command": "npx",
      "args": ["-y", "@paulperigault/mcp"]
    }
  }
}
```

Ou en ligne de commande :

```sh
claude mcp add --scope project paulperigault-ds -- npx -y @paulperigault/mcp
```

### Kiro

Fichier `.kiro/settings/mcp.json` du projet :

```json
{
  "mcpServers": {
    "paulperigault-ds": {
      "command": "npx",
      "args": ["-y", "@paulperigault/mcp"],
      "disabled": false
    }
  }
}
```

### Cursor

Fichier `.cursor/mcp.json` du projet :

```json
{
  "mcpServers": {
    "paulperigault-ds": {
      "command": "npx",
      "args": ["-y", "@paulperigault/mcp"]
    }
  }
}
```

## Outils

Chaque réponse est du JSON précédé d'une ligne qui la marque comme donnée. Une entrée invalide
ou inconnue renvoie une erreur d'outil (`isError: true`) au message explicite.

| Outil              | Rôle                                                                      | Exemple d'arguments                                             |
| ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `list_components`  | Composants publiés (slug, titre, groupe, rôle), filtre par groupe         | `{ "group": "forms" }`                                          |
| `get_component`    | Fiche : rôle, usages, propriétés, exemple, accessibilité, jetons, preuves | `{ "slug": "button" }`                                          |
| `get_tokens`       | Jetons par rôle et thème, OKLCH et hexadécimal, contraste des paires      | `{ "role": "color", "theme": "dark" }`                          |
| `check_contrast`   | Ratio WCAG 2, niveaux AA/AAA, Lc APCA informatif                          | `{ "foreground": "--pp-color-muted", "background": "#ffffff" }` |
| `validate_snippet` | Garde-fous sur un extrait `astro`, `html`, `css` ou `md`                  | `{ "language": "css", "code": ".a { margin-left: 1rem; }" }`    |
| `search_docs`      | Recherche plein texte dans la documentation, 20 résultats au plus         | `{ "query": "focus visible", "limit": 5 }`                      |
| `get_decision`     | ADR ou ligne du journal des décisions, par identifiant ou par recherche   | `{ "id": "ADR-0003" }` ou `{ "query": "contraste" }`            |

Détails :

- `get_component` : un slug inconnu renvoie les slugs proches.
- `check_contrast` : couleurs `#rgb`, `#rrggbb`, `oklch(L C H)` ou jeton `--pp-…`, résolu dans
  `theme` (`light` par défaut). Le ratio WCAG 2 vient de `@paulperigault/tokens/contrast`. Le Lc
  suit APCA-W3 0.1.9 ; il est informatif, APCA n'est pas normatif en WCAG 2.2.
- `validate_snippet` : règles de `@paulperigault/guards` (dégradés, ombres, flou, emoji,
  couleurs brutes, palette Tailwind, valeurs arbitraires, propriétés physiques…), jetons `--pp-*`
  inconnus, attribut `style` en ligne et balise d'image sans `width` ni `height`. Chaque violation
  porte la règle, la ligne, un message et une correction proposée.

## Garanties

- Lecture seule : aucun outil n'écrit de fichier, ne publie ni ne modifie de configuration.
  Chaque outil porte les annotations `readOnlyHint: true`, `destructiveHint: false`,
  `openWorldHint: false`.
- Hors ligne : aucune connexion réseau à l'exécution. Les données sont embarquées dans `data/`
  à la publication.
- Aucune exécution : `validate_snippet` analyse le texte en mémoire, sans l'évaluer ni l'écrire
  sur le disque. Aucun sous-processus.
- Entrées validées par zod, schéma strict par outil (clé inconnue refusée) : texte de 20 000
  caractères au plus, identifiants de 64 caractères au plus, au motif `^[a-z0-9-]+$`.
- stdout est réservé au protocole ; les journaux vont sur stderr.

## Limites

- Les données datent de la publication du paquet : une page de documentation modifiée depuis
  n'y figure pas.
- La recherche compte les occurrences des mots (sans accents ni casse) : ni racinisation, ni
  synonymes.
- `validate_snippet` repose sur des expressions régulières : il ne comprend pas les expressions
  JavaScript d'un fichier Astro et peut manquer un cas ou en signaler un à tort.
- `check_contrast` ignore la transparence ; une couleur hors du gamut sRGB est refusée.
- La documentation embarquée est en français.

## Maintenance

Dans le dépôt, après `npm -w @paulperigault/docs run build` :

```sh
npm -w @paulperigault/mcp run build:data
npm -w @paulperigault/mcp run check:data
```

`check:data` sort avec le code 1 et liste les fichiers de `data/` à régénérer.

## Licence

MIT
