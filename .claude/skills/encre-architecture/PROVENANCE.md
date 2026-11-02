# Provenance : encre-architecture

Skill réécrit, jamais copié tel quel. Règle : `encre-securite`, « Skills tiers : provenance » (D-116).
Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Consulté le 2026-11-02.

| Source                               | URL                                         | SHA lu                                     | Licence                     |
| ------------------------------------ | ------------------------------------------- | ------------------------------------------ | --------------------------- |
| c4-architecture (grille des niveaux) | https://github.com/softaworks/agent-toolkit | `3027f20f3181758385a1bb8c022d4041dfb4de84` | MIT, © 2026 Leonardo Flores |

## Modifications

- Fond : ADR-0006 et `AGENTS.md` du dépôt. Du texte tiers, seule la grille des niveaux C4 et sa règle
  « contexte et conteneurs suffisent » (`c4-architecture`, softaworks/agent-toolkit) sont reprises,
  en français et réécrites ; aucun exemple Mermaid de la source n'est copié.
- Non repris : `clean-architecture-skills` (licence sans titulaire), les skills `mermaid-diagrams`,
  `qa-test-planner` (scripts shell), tout autre skill du dépôt.
- Ajoutés : « Surcharges Encre », vérifications adaptées aux couches d'ADR-0006, tableau de code
  smells relié aux contrôles du dépôt.

## Licences (copiées telles quelles)

### https://github.com/softaworks/agent-toolkit : LICENSE

```text
MIT License

Copyright (c) 2026 Leonardo Flores

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
