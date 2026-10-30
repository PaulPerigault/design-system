# Historique : lots L0 à L20

Déplacé tel quel depuis `docs/run-report.md` (D-080). Bilans par lot : `docs/lots/`. Liens relatifs ajustés.

**État au 2026-10-24.** L10 à L17 fusionnés dans `develop` (#19 : L15 et L16 ; #21 : L17). #22 : lots L18 et L19, 14
composants de niveau 2. Fait depuis la reprise sous Kiro : sécurité et
chaîne d'approvisionnement (L15), vitrine (L16), déclaration d'accessibilité et PWA (L17), composants
(L18, L19). `verify` : 1789 tests ; e2e local : 5792 passés. Détail : `docs/journal/2026-10-24.md`.
Reste : audit RGAA et lecteurs d'écran (manuel), relecture des textes par Paul, choix de l'hébergeur et
de la licence des contenus (`docs/manual-steps.md` §6), puis les quatre actions du propriétaire.
Dernière mise à jour : 2026-10-21, 10:01, après la fusion de L7. Le journal détaillé est dans
`docs/journal/`, les décisions dans `docs/decisions-log.md`, chaque lot dans `docs/lots/`.

## Lots

| Lot | Statut                      | Contenu                                                            | Bilan               |
| --- | --------------------------- | ------------------------------------------------------------------ | ------------------- |
| L0  | fusionné (#1)               | squelette, CI, garde-fous de l'assistant, agents Kiro, dispatcher  | [L0](../lots/L0.md) |
| L1  | fusionné (#2)               | pilote Stack via Kiro                                              | [L1](../lots/L1.md) |
| L2  | fusionné (#3)               | identité « Encre », tokens DTCG OKLCH, générateur, contraste       | [L2](../lots/L2.md) |
| —   | fusionné (#4)               | dispatcher v2 : coordination partagée, amorce, moteur ds-lead      | —                   |
| L3  | fusionné (#5)               | 7 primitives de layout                                             | [L3](../lots/L3.md) |
| L4  | fusionné (#6)               | 7 composants de formulaire                                         | [L4](../lots/L4.md) |
| L5  | fusionné (#7)               | 10 composants de retour et de structure                            | [L5](../lots/L5.md) |
| L8  | fusionné (#9)               | `@paulperigault/guards` empaqueté, CLI `create`, job « site »      | [L8](../lots/L8.md) |
| L6  | fusionné (#10)              | pipeline d'images, 7 composants média                              | [L6](../lots/L6.md) |
| L7  | fusionné (#11)              | doc complète, a11y sur toutes les pages, registre assemblé, mesure | [L7](../lots/L7.md) |
| L9  | **arrêté à la préparation** | paquets non publiés (404 sur les cinq) : migration impossible      | « L9 » ci-dessous   |

État de `develop` : `npm run verify` vert (1117 tests unitaires, `astro check` sans erreur,
registre à jour), `npm run e2e` vert (338 tests Playwright : axe sur les 33 pages × 2 thèmes ×
2 fenêtres, 1.4.12, cibles, clavier, CLS, mesure).

## L9 : migration du portfolio

Le kickoff conditionne la migration aux paquets publiés en dist-tag `next`, donc au trusted
publisher. Le registre public répond 404 pour `@paulperigault/{tokens,css,astro,guards,create}`
(vérifié le 2026-10-21 sans lire `~/.npmrc`) : la branche s'arrête ici, comme prévu. Fait côté
portfolio : test des empreintes SHA-256 du favicon et du logo (PR portfolio #270, fusionnée). À faire après
la publication : remplacer les composants dupliqués du portfolio par `@paulperigault/astro@next`,
lot par lot (layout, formulaire de contact, images), avec ses e2e comme filet.

## Reste à faire hors L9

- Tableaux de propriétés de la doc : 28 pages à passer sur un composant commun bâti sur `Table`.
- Règle `physical-property` étendue aux classes Tailwind physiques (`ml-*`, `text-left`…).
- Mineurs de L6 : `sizes` du dialogue d'agrandissement, collision d'identifiants entre deux
  galeries aux préfixes proches, cache de `dominantColor` en `astro dev`.

## Lot L20 (2026-10-24) : Open Graph, domaine, liens croisés

- 65 images `dist/og/*.png` (1200×630, identité Encre, contraste testé) ; échec si une balise `og:image` pointe vers un fichier absent.
- Domaine `design.paulperigault.dev` partout ; `registry.json` et `docs.json` régénérés.
- `rel="author"`, `sameAs`, JSON-LD contrôlés sur 66 pages ; réciprocité du portfolio sous `PORTFOLIO_LINK_CHECK=1`.
- Vérifié : `npm run verify`, Playwright chromium (664 réussis, 1 sauté). Non vérifié : rendu des images sous Linux, test réciproque réel.
- À faire par le propriétaire : DNS et projet Pages pour `design.paulperigault.dev` ; lien retour sur paulperigault.fr. Décision D-026.
