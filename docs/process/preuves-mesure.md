# Mesure de `proofs.json`

`npm run proofs` réécrit `apps/docs/src/data/proofs.json` (script : `tools/checks/measure-proofs.mjs`,
analyseurs testés dans `proofs-core.mjs`). Aucune dépendance. Passer ensuite `npx prettier --write` sur le fichier. Reconstruire la doc avant
(`npm -w @paulperigault/docs run build`) : pages, composants et glossaire se comptent dans `dist/`.

| Champ                      | Source de la mesure                                            |
| -------------------------- | -------------------------------------------------------------- |
| `tests.unit`               | `vitest run --reporter=json` (`numTotalTests`), tests exécutés |
| `tests.e2eDeclared`        | `playwright test --list` : tests **déclarés**, pas exécutés    |
| `content.pages`            | fichiers `index.html` de `dist/` hors Pagefind                 |
| `content.components`       | dossiers `dist/components/<nom>/`                              |
| `content.registryItems`    | `packages/astro/registry/registry.json`                        |
| `content.glossaryTerms`    | balises `<dt>` de `dist/glossaire/`                            |
| `accessibility.contrast*`  | `packages/tokens/src/roles.json`                               |
| `security.auditSignatures` | `npm audit signatures` (réseau)                                |

Non mesurés par le script, donc conservés : `devices`, `themes`, `axeViolations`, `target`, budgets,
CSP, scripts d'installation, ressources tierces. `axeViolations` vient de
`apps/docs/e2e/matrix/axe.spec.ts` : le relancer (`npx playwright test -c apps/docs/playwright.config.ts
matrix/axe.spec.ts`) avant de republier. Le compte e2e est un décompte : la page l'affiche comme
tel (« déclarés »), parce que l'exécution complète exige Linux (Visuel).
