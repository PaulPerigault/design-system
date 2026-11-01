# Bilan du chantier ADR-0006 (étapes 3 à 11, V1 à V5)

Établi le 2026-11-01 d'après `docs/journal/`, `docs/decisions-log.md` et l'état du run. Le bilan de
jalon de `docs/run-report.md` reste à écrire en fin de jalon (D-080) : ce fichier ne le remplace pas.

## Produit

| Étape   | Issue     | Livré                                                                                                                         | PR               | Décisions           |
| ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------- |
| 3       | #83       | `guards` : structure type, règle de dépendance vers l'intérieur                                                               | #154, #155       |                     |
| 4       | #84       | `create` en anneaux, DTO validés aux arguments                                                                                | #156, #157       |                     |
| 5       | #85       | `mcp` et générateur de tokens en anneaux, self-test `pp-mcp --self-test`                                                      | #173, #174       | D-073, D-074        |
| 6       | #86       | `tools/agents` en anneaux, `dist/` pour chaque paquet publié                                                                  | #159 à #162      |                     |
| 7a, 7b  | #88, #89  | crate `pp-color`, contraste WCAG 2, APCA, parité avec `tokens`                                                                | #190, #191       | D-085 à D-090       |
| 8       | #90       | crate `pp-color-wasm` et paquet `@paulperigault/color`                                                                        | #192             | D-091 à D-094       |
| V4a     | #98       | crate `pp-data` : quantiles type 7, LTTB, agrégation                                                                          | #193, #194       | D-095 à D-098       |
| V4b     | #99       | crate `pp-data-wasm` et paquet `@paulperigault/data`                                                                          | #195, #196       | D-099, D-100        |
| V5      | #100      | page `/tableau-de-bord/`                                                                                                      | #199             | D-102               |
| 9       | #91       | mesure du pipeline d'images                                                                                                   | #201             | D-104               |
| 10      | #102      | mesures de poids affichées, carbone SWD v4, page `/sobriete/`                                                                 | #203             | D-106               |
| 11      | #103      | Dependabot pour Cargo (`cargo audit` et `cargo deny` tournaient déjà dans le job `rust`), documentation des paquets, ce bilan |                  | D-107               |
| process | #197, #80 | mesure de duplication, matrice des contrôles                                                                                  | #198, #200, #202 | D-101, D-103, D-105 |

## Mesures

- Duplication (`npm run check:duplication`) : 2,18 % avant la factorisation des scripts `.wasm`,
  1,65 % après (D-103).
- Images (`npm run benchmark:images`) : AVIF 55,3 Kio, WebP 74,2 Kio, repli 236,7 Kio pour 31
  variantes ; build de la doc 24,4 s à froid (D-104).
- Pages (`npm run benchmark:weight`) : 42 à 48 Kio brotli, dont 33 Kio de police ; 6 à 7 mg de
  CO2e par page vue pour un nouveau visiteur, modèle SWD v4 (D-106).
- `.wasm` : `color` et `data` chargés à la demande, jamais par une page de la documentation.

## Décisions de conduite

- Le poids ne bloque jamais la CI (D-106) : ADR-0006 décision 5 amendée.
- `jscpd` écarté (binaire de 43 Mo) au profit d'un script sans dépendance (D-103).
- Une règle de design avant code est écrite dans `encre-processus` (D-101).

## Reste

- Menu à six entrées (#123), en dernier.
- Nombre de builds Cloudflare du mois : à lire dans le compte Cloudflare.
- Tests visiteurs de #123 : à faire par Paul.
- Le bilan de jalon de `docs/run-report.md`.
