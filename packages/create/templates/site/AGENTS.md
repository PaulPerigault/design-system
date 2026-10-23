# AGENTS.md

Ce site utilise le design system @paulperigault. Ces règles s'adressent aux assistants IA et aux
humains qui y contribuent.

## Serveur MCP

Le serveur `pp-ds` (`@paulperigault/mcp`, binaire `pp-mcp`, stdio) est déclaré dans `.mcp.json`
(Claude Code), `.kiro/settings/mcp.json` (Kiro) et `.cursor/mcp.json` (Cursor). Il est installé
en `devDependency` : rien n'est téléchargé à l'exécution.

Avant d'écrire un composant :

- `list_components` : les composants disponibles ;
- `get_component` : API, variantes et exemple d'un composant ;
- `get_tokens` : les jetons `--pp-*` ;
- `validate_snippet` : contrôle d'un extrait avant de l'enregistrer.

## Règles

1. Utiliser les composants existants ; ne pas en inventer. S'il en manque un, le signaler.
2. Styler par les jetons `--pp-*` seulement : aucune couleur, taille, espacement, rayon ou durée
   brute.
3. Aucun attribut `style` en ligne : la CSP du site est stricte et l'ignore. Passer par un
   attribut `data-*` ou une classe, mappés en CSS.
4. Propriétés logiques (`inline`, `block`) plutôt que physiques (`left`, `margin-top`).
5. Lancer `npm run verify` avant de conclure, et corriger ce qu'il signale.

## Interdits

Sauf décision écrite et motivée :

- dégradés décoratifs ;
- ombres décoratives ;
- flou d'arrière-plan ;
- emoji ;
- palette Tailwind par défaut ;
- valeurs arbitraires dans les classes utilitaires.

## Commits

Conventional Commits, sujet en minuscules de 72 caractères au plus, sans signature d'outil.
