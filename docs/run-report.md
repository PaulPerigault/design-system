# Rapport d'exécution : repères

Une page de repères, mise à jour en fin de jalon. Le détail par PR est dans le journal du jour
(`docs/journal/`), les décisions dans `docs/decisions-log.md`, l'historique archivé dans
`docs/history/` (D-080).

## État global (2026-10-30)

- `main` est la seule branche ; chaque étape = une issue = une PR squash, CI verte (`AGENTS.md`).
- Sept paquets et `apps/docs` en place : `tokens`, `css`, `dataviz`, `astro`, `guards`, `create`, `mcp`.
- TypeScript strict et structure en anneaux : faits pour `guards`, `create`, `mcp`, `tools/agents`.
- Paquets publiés compilés dans `dist/` ; condition d'export `@paulperigault/source` (D-075).
- Analyse de données (M-analyse) : `LineChart`, `BarChart`, `AreaChart`, `GaugeChart`, `KpiCard`,
  `Sparkline`, `DataTable`, `Legend` faits ; V4a et suivantes dépendent de la crate Rust `pp-data`.
- Refonte du site (#123, ADR-0008) : accueil, « Utiliser », textes faits ; reste données et navigation.
- Skills de revue `encre-*` : design, voix, processus, sécurité, mobile, greenops ; reste rust (#178).
- Aucune publication npm, aucun `apply` OpenTofu : actions de Paul (voir plus bas).

## Jalons

Source : [milestones GitHub](https://github.com/PaulPerigault/design-system/milestones), état au 2026-10-30.

| Jalon                          | Ouvertes | Fermées |
| ------------------------------ | -------: | ------: |
| M0 fondations                  |        5 |      18 |
| M1 TypeScript strict           |        2 |       9 |
| M2 publication npm 0.x         |        5 |       0 |
| M3 migration du portfolio (L9) |        1 |       0 |
| M4 Rust pp-color et pp-data    |        5 |       0 |
| M5 1.0                         |        9 |       5 |
| M-analyse                      |        4 |      14 |

## Liens

- [Project 13](https://github.com/users/PaulPerigault/projects/13) : suivi des issues.
- [Décisions](decisions-log.md), [journal](journal/), [historique archivé](history/).
- Archives : [lots L0 à L20](history/lots-L0-L20.md), [bilan Kiro](history/bilan-kiro.md),
  [phase 2](history/phase2-2026-10-21.md), [chantier et PR](history/chantier-pr.md),
  [actions et tableaux de PR](history/pr-et-actions.md).

## Actions manuelles restantes de Paul

Commandes exactes dans [manual-steps.md](manual-steps.md).

- #107 : déclarer le site à Search Console et Bing Webmaster.
- #108 : trusted publisher npm sur les cinq paquets.
- #109 : fusionner les PR de release-please vers `main`.
- #110 : tests de lecteurs d'écran (NVDA, VoiceOver).
- #111 : installer la PWA sur un appareil réel.
- #112 : relire les textes « à relire par Paul ».
- #113 : choisir la licence des contenus.
- Jeton `RELEASE_PLEASE_TOKEN` : le créer et le poser en secret (`manual-steps.md` §11).

## Points ouverts

- Refonte du site : sous-issue « données », décision sur la navigation, tests avec visiteurs (Paul).
- Rust (M4) : `pp-color` et `pp-data`, conditionnés à `cargo audit` et `cargo deny`.
- Hors L9 : tableaux de propriétés à passer sur un composant commun, règle `physical-property`
  étendue aux classes Tailwind (détail dans `history/lots-L0-L20.md`).
- Dépendances : triage Dependabot (#131), miroir GitHub Packages facultatif (#130).
