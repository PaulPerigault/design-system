# Historique rattaché : lots L0 à L20 et commits hors lot

Correspondance lot, issue de rattrapage, PR et SHA de fusion (D-034). Aucun commit n'est réécrit :
chaque issue cite la PR et le SHA d'origine. Les SHA sont ceux de `main` après squash
(`git log --oneline` ; PR : `gh pr list --state merged`). Dates : date de commit, heure locale.

Retrouver un commit : chercher le SHA court ou le numéro de PR dans les tableaux ci-dessous, puis
ouvrir l'issue du lot (périmètre, critères) et `docs/lots/Lx.md` (bilan). `git show <sha>` donne le diff.

Les numéros d'issue sont attribués à la création (`tmp/create-catchup-issues.ps1`, lancé par Paul) :
la colonne « Issue » donne le titre, les numéros sont lisibles dans l'issue parente
« [Historique] Lots L0 à L20 ».

## Lots

| Lot | Issue (titre)                                | PR  | SHA       | Date       | Note                                  |
| --- | -------------------------------------------- | --- | --------- | ---------- | ------------------------------------- |
| L0  | [L0] vérifications, squelette, CI, agents    | #1  | `13bd245` | 2026-10-20 |                                       |
| L1  | [L1] pilote Stack via Kiro                   | #2  | `8e932d9` | 2026-10-20 |                                       |
| L2  | [L2] identité « Encre » et fondations        | #3  | `023e6dd` | 2026-10-21 |                                       |
| L3  | [L3] primitives de layout                    | #5  | `aaf4560` | 2026-10-21 |                                       |
| L4  | [L4] formulaires                             | #6  | `e712b04` | 2026-10-21 |                                       |
| L5  | [L5] retour et structure                     | #7  | `7e158cb` | 2026-10-21 |                                       |
| L6  | [L6] images                                  | #10 | `915de13` | 2026-10-21 | fusionné après L8 (#9)                |
| L7  | [L7] documentation, accessibilité, registre  | #11 | `6c8f99a` | 2026-10-21 |                                       |
| L8  | [L8] garde-fous empaquetés et CLI            | #9  | `857e5f7` | 2026-10-21 |                                       |
| L9  | [L9] migration du portfolio                  | —   | —         | —          | issue ouverte : rien livré            |
| L10 | [L10] corrections et hygiène                 | #13 | `5dbdd10` | 2026-10-21 |                                       |
| L11 | [L11] référentiel                            | #14 | `4d5ce00` | 2026-10-21 |                                       |
| L12 | [L12] mobile d'abord, ordinateur excellent   | #15 | `5a08edc` | 2026-10-23 |                                       |
| L13 | [L13] documentation lisible et accessible    | #17 | `a0d9adc` | 2026-10-23 | même PR que L14                       |
| L14 | [L14] lisible par les IA                     | #17 | `a0d9adc` | 2026-10-23 | même PR que L13                       |
| L15 | [L15] sécurité et chaîne d'approvisionnement | #19 | `4068766` | 2026-10-24 | même PR que L16                       |
| L16 | [L16] site vitrine                           | #19 | `4068766` | 2026-10-24 | même PR que L15                       |
| L17 | [L17] déclaration d'accessibilité et PWA     | #21 | `d2102e1` | 2026-10-24 |                                       |
| L18 | [L18] composants de niveau 2 (1/2)           | #22 | `9bf2616` | 2026-10-24 | même PR que L19                       |
| L19 | [L19] composants de niveau 2 (2/2)           | #22 | `9bf2616` | 2026-10-24 | même PR que L18                       |
| L20 | [L20] images OG, police Atkinson, domaine    | #24 | `2585f1c` | 2026-10-24 | à valider : pas de `docs/lots/L20.md` |

Rattachement de L20 à valider : aucun bilan de lot ; périmètre tiré du corps de la PR #24 et de
`docs/journal/2026-10-24.md`. Les paquets et tailles (labels `pkg:` et `taille:`) sont un choix de
reconstitution : un lot touche souvent plusieurs paquets, l'issue porte le principal.

## Hors lot : une issue « divers » par période

| Issue (titre)                                            | PR ou commit   | SHA       | Note                          |
| -------------------------------------------------------- | -------------- | --------- | ----------------------------- |
| [Divers 2026-10-20/21] amorce, ds-lead, rapport final    | commit sans PR | `cbdfcc7` | à valider : amorce du dépôt   |
|                                                          | #4             | `9d43175` | dispatcher v2, moteur ds-lead |
|                                                          | #12            | `d0e5142` | rapport d'exécution final     |
| [Divers 2026-10-24] arrêt final, ADR-0005, tokens strict | #23            | `7bd1518` |                               |
|                                                          | #25            | `9c426eb` | ADR-0005                      |
|                                                          | #26            | `a1aa102` | tokens en TypeScript strict   |
| [Divers 2026-10-27] dépendances et guards strict         | #27            | `34f1cd4` | Dependabot ; à valider        |
|                                                          | #28            | `686f279` | Dependabot ; à valider        |
|                                                          | #30            | `fc43ef4` | guards en TypeScript strict   |

Le plan de F1 prévoyait une issue par commit hors lot et aucune pour Dependabot ; D-034 regroupe par période
(consigne F2b-2a). Les deux regroupements Dependabot sont à valider par Paul.

## Hors périmètre de cette étape

Les PR du chantier « fondations » n'ont pas d'issue ici : leurs issues relèvent de F2b-2b.

| PR  | SHA       | Contenu                                  |
| --- | --------- | ---------------------------------------- |
| #31 | `bd638f3` | proposition des fondations (F1)          |
| #32 | `d577b96` | décisions de Paul actées (F1b)           |
| #33 | `6c4981d` | CI : installation unique, hooks minimaux |
| #34 | `2673906` | CI : tests par pertinence (sans `(#n)`)  |
| #35 | `4bb984f` | tests portables Windows, Visuel Linux    |
| #36 | `f1c2b2e` | Project GitHub, labels, synchro (F2a-1)  |
| #37 | `eed2618` | bascule vers `main` seule (F2a-2)        |
| #38 | `99e5e13` | ruleset `main` versionné                 |
| #39 | `d1fa8c3` | modèles d'issue et de PR (F2b-1)         |

Les PR #8, #16, #18, #20 et #29 ne figurent pas dans `main` (fermées sans fusion).
