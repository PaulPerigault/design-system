# Provenance : encre-mobile-natif

Skill réécrit, jamais copié tel quel. Règle : `encre-securite`, « Skills tiers : provenance » (D-116).
Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Consulté le 2026-11-02.

| Source        | URL                                    | SHA lu                                     | Licence                   |
| ------------- | -------------------------------------- | ------------------------------------------ | ------------------------- |
| mobile-native | https://github.com/emilkowalski/skills | `f1090bec277140d02ed202440185ad9d02ac1490` | MIT, © 2026 Emil Kowalski |

## Modifications

- Traduction en français, réduction à 113 lignes ; tableau de symptômes conservé, explications
  condensées ; socle réduit au viewport du dépôt (`width=device-width, initial-scale=1`).
- Retirés : la phrase d'accueil imposée, `viewport-fit=cover` et `interactive-widget` du socle (écart à
  décider par écrit), le retour d'appui par `transform: scale()`, la référence à Tailwind et à Next.js.
- Modifié : `-webkit-tap-highlight-color` n'est retiré qu'avec un `:active` équivalent.
- Ajoutés : « Surcharges Encre », jetons `--pp-*`, propriétés logiques, renvoi à `encre-mobile`.
- `animation-performance` et `review-animations` lus, non retenus (React, flou, ressorts) ; trois
  règles gardées : `transform` et `opacity`, jamais `transition: all`, `prefers-reduced-motion`.

## Licences (copiées telles quelles)

### https://github.com/emilkowalski/skills : LICENSE

```text
MIT License

Copyright (c) 2026 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
