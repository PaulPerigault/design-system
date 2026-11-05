# @paulperigault/astro

Composants Astro accessibles, publiés en source (`.astro` et `.ts`) et bâtis sur
`@paulperigault/css`. Astro les compile dans le projet qui les importe : aucun build préalable.

Publié sur npmjs. Série `0.x` : l'API peut changer d'une version à l'autre, lire le
[CHANGELOG](https://github.com/PaulPerigault/design-system/blob/main/packages/astro/CHANGELOG.md)
avant une mise à jour.

## Installation

```bash
npm install @paulperigault/astro @paulperigault/css
```

Dépendance de pair : `astro` `^7.4.0`. Node 24 ou plus récent.

## Exemple

Charger `@paulperigault/css` une fois, dans la mise en page : il apporte les tokens `--pp-*` dont
les composants dépendent. Puis importer chaque composant par son chemin.

```astro
---
import '@paulperigault/css';
import Button from '@paulperigault/astro/Button.astro';
import Stack from '@paulperigault/astro/Stack.astro';
---

<Stack space="l">
  <h1>Contact</h1>
  <p>Un paragraphe.</p>
  <Button href="/contact/">Écrire</Button>
</Stack>
```

`Button` rend un `<button>` natif, ou un `<a>` quand `href` est fourni. `Stack` espace ses enfants
par l'attribut `data-space`, sans attribut `style` (CSP stricte).

## Ce que contient le paquet

- 54 composants `.astro`, un sous-chemin chacun (`@paulperigault/astro/<Nom>.astro`) : mise en
  page, formulaires, retours, contenu, navigation, médias, superpositions et graphiques. Liste
  exacte : champ `exports` de `package.json`.
- `variants`, `field-ids`, `scrim`, `media-types` : modules TypeScript, compilés par Astro et Vite
  (un `node` seul refuse un `.ts` sous `node_modules`).
- `registry.json` : le registre lu par `@paulperigault/create` (`add`, `eject`, `diff`).

Zéro JavaScript par défaut. Les composants qui en ont besoin (`Tabs`, `Menu`, `Combobox`,
`Tooltip`, `Toast`, `CodeBlock`, `InvokerFallback`) embarquent leur script dans leur fichier.
Chaque composant a sa page sur [design.paulperigault.dev](https://design.paulperigault.dev) :
propriétés, accessibilité, exemples.

## Provenance

Chaque version est publiée par le workflow `release` du dépôt, avec une attestation de
provenance npm. Dans un projet qui installe ce paquet, `npm audit signatures` vérifie les
signatures du registre et les attestations. Détails :
[publication npm](https://github.com/PaulPerigault/design-system/blob/main/docs/process/publication.md).

## Licence et liens

- Licence MIT : [LICENSE](https://github.com/PaulPerigault/design-system/blob/main/packages/astro/LICENSE)
- Documentation : <https://design.paulperigault.dev>
- Source : <https://github.com/PaulPerigault/design-system/tree/main/packages/astro>
- Versions : [CHANGELOG.md](https://github.com/PaulPerigault/design-system/blob/main/packages/astro/CHANGELOG.md)
