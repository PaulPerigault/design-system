# @paulperigault/css

Feuilles de style de base du design system, bâties sur `@paulperigault/tokens` : tokens `--pp-*`,
polices, base typographique, impression, et un thème Tailwind v4 limité aux tokens.

Publié sur npmjs. Série `0.x` : l'API peut changer d'une version à l'autre, lire le
[CHANGELOG](https://github.com/PaulPerigault/design-system/blob/main/packages/css/CHANGELOG.md)
avant une mise à jour.

## Installation

```bash
npm install @paulperigault/css
```

Node 24 ou plus récent. Les feuilles importent d'autres paquets (`@paulperigault/tokens`,
`@fontsource-variable/atkinson-hyperlegible-*`) par leur nom : il faut un outil qui résout ces
`@import`, comme Vite dans Astro.

## Exemple

Dans un projet Astro, une seule ligne dans la mise en page (c'est ce que fait le site généré par
`@paulperigault/create`) :

```astro
---
import '@paulperigault/css';
---
```

Avec Tailwind v4 (à installer par le projet, ce paquet n'en dépend pas) :

```css
@import 'tailwindcss';
@import '@paulperigault/css';
@import '@paulperigault/css/theme.css';
```

`theme.css` remet à zéro les couleurs, polices, tailles, ombres, rayons et espacements par défaut
de Tailwind et n'expose que les tokens : `bg-surface`, `text-fg`, `p-m`, `rounded-control`. Une
classe de la palette par défaut (`bg-blue-500`) ne produit plus rien.

## Sous-chemins

| Import                         | Contenu                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| `@paulperigault/css`           | `tokens.css`, `fonts.css`, `base.css` et `print.css`, dans cet ordre        |
| `@paulperigault/css/base.css`  | couche `base` : page, titres, liens, focus visible, mouvement réduit        |
| `@paulperigault/css/fonts.css` | Atkinson Hyperlegible Next et Mono, variables, replis aux métriques ajustés |
| `@paulperigault/css/print.css` | impression : thème clair forcé, adresse des liens externes                  |
| `@paulperigault/css/theme.css` | thème Tailwind v4 (`@theme inline`) et variante `js`                        |

Thème clair ou sombre : les couleurs suivent `prefers-color-scheme` ; `data-theme="light"` ou
`data-theme="dark"` sur `<html>` force l'un des deux.

Polices : licence OFL-1.1, texte dans `LICENSES/OFL-atkinson-hyperlegible.txt` (publié avec le
paquet).

## Provenance

Chaque version est publiée par le workflow `release` du dépôt, avec une attestation de
provenance npm. Dans un projet qui installe ce paquet, `npm audit signatures` vérifie les
signatures du registre et les attestations. Détails :
[publication npm](https://github.com/PaulPerigault/design-system/blob/main/docs/process/publication.md).

## Licence et liens

- Licence MIT : [LICENSE](https://github.com/PaulPerigault/design-system/blob/main/packages/css/LICENSE)
- Documentation : <https://design.paulperigault.dev>
- Source : <https://github.com/PaulPerigault/design-system/tree/main/packages/css>
- Versions : [CHANGELOG.md](https://github.com/PaulPerigault/design-system/blob/main/packages/css/CHANGELOG.md)
