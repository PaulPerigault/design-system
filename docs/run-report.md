# Rapport d'exécution

**ARRÊT FINAL** — raison : arrêt de session après la fusion de L18 et L19 (#22), pas un manque de
crédits (≈ 250 tracés sur ≈ 870). Il reste du travail faisable sans Paul (images OG, ci-dessous) et
des décisions qui lui reviennent (`docs/manual-steps.md` §6).

**Défaut connu, non corrigé : les images Open Graph ne sont pas générées.** Les pages déclarent
`og:image` vers `/og/<page>.png` (`lib/seo.ts`), mais aucun fichier n'est produit au build : ces URL
répondent 404. Le brief demandait des images OG générées au build. Piste : `sharp` est déjà là ; le
texte exige une police lisible par librsvg (pas de `woff2`), donc à traiter avec soin. Tant que ce
n'est pas fait, retirer les balises `og:image` plutôt que de publier des liens morts.

**Reprise suggérée.** (1) images OG, (2) intégrer les quatre actions du propriétaire, (3) L9
(migration du portfolio) une fois les paquets publiés.

**État au 2026-10-24.** L10 à L17 fusionnés dans `develop` (#19 : L15 et L16 ; #21 : L17). #22 : lots L18 et L19, 14
composants de niveau 2. Fait depuis la reprise sous Kiro : sécurité et
chaîne d'approvisionnement (L15), vitrine (L16), déclaration d'accessibilité et PWA (L17), composants
(L18, L19). `verify` : 1789 tests ; e2e local : 5792 passés. Détail : `docs/journal/2026-10-24.md`.
Reste : audit RGAA et lecteurs d'écran (manuel), relecture des textes par Paul, choix de l'hébergeur et
de la licence des contenus (`docs/manual-steps.md` §6), puis les quatre actions du propriétaire.

**Crédits Kiro depuis la reprise (23 octobre) : ≈ 250 tracés sur ≈ 870.** haiku-5.5 : 17 tâches, 14 ;
sonnet-5.5 : 19, 103 ; opus-5.5 : 2, 133 (T14.05 : 102 ; Combobox : 31). Les paliers mech et light font
45 % des tentatives, sous la cible de 50 % : les composants à comportement clavier ont demandé
sonnet ou opus. Les revues croisées de Combobox n'ont rendu aucun verdict (permissions refusées en
mode non interactif) ; relue par l'orchestrateur. Consommation réelle côté Kiro : non mesurée.

Dernière mise à jour : 2026-10-21, 10:01, après la fusion de L7. Le journal détaillé est dans
`docs/journal/`, les décisions dans `docs/decisions-log.md`, chaque lot dans `docs/lots/`.

## Lots

| Lot | Statut                      | Contenu                                                            | Bilan             |
| --- | --------------------------- | ------------------------------------------------------------------ | ----------------- |
| L0  | fusionné (#1)               | squelette, CI, garde-fous de l'assistant, agents Kiro, dispatcher  | [L0](lots/L0.md)  |
| L1  | fusionné (#2)               | pilote Stack via Kiro                                              | [L1](lots/L1.md)  |
| L2  | fusionné (#3)               | identité « Encre », tokens DTCG OKLCH, générateur, contraste       | [L2](lots/L2.md)  |
| —   | fusionné (#4)               | dispatcher v2 : coordination partagée, amorce, moteur ds-lead      | —                 |
| L3  | fusionné (#5)               | 7 primitives de layout                                             | [L3](lots/L3.md)  |
| L4  | fusionné (#6)               | 7 composants de formulaire                                         | [L4](lots/L4.md)  |
| L5  | fusionné (#7)               | 10 composants de retour et de structure                            | [L5](lots/L5.md)  |
| L8  | fusionné (#9)               | `@paulperigault/guards` empaqueté, CLI `create`, job « site »      | [L8](lots/L8.md)  |
| L6  | fusionné (#10)              | pipeline d'images, 7 composants média                              | [L6](lots/L6.md)  |
| L7  | fusionné (#11)              | doc complète, a11y sur toutes les pages, registre assemblé, mesure | [L7](lots/L7.md)  |
| L9  | **arrêté à la préparation** | paquets non publiés (404 sur les cinq) : migration impossible      | « L9 » ci-dessous |

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

## Bilan Kiro

Les 1000 crédits offerts sont **épuisés** (quota mensuel `MONTHLY_REQUEST_COUNT` atteint le
2026-10-21 vers 08:55, non renouvelable). Kiro est marqué indisponible (D-016) ; la fin de L6 et
L7 ont été faites par l'orchestrateur seul.

### Crédits tracés : ≈ 865 sur 1000

| Poste                                    | Crédits | Source                                  |
| ---------------------------------------- | ------: | --------------------------------------- |
| Exécutions de tâches (105 tentatives)    |  428,80 | `.agents/routing-log.jsonl`             |
| Revues (34)                              |   99,24 | flux `.agents/runs/*.review-*.jsonl`    |
| Sessions de chef de lot ds-lead (L8, L6) |  337,31 | journal (257,47 pour L8, 79,84 pour L6) |
| **Total tracé**                          | **865** |                                         |

Les ≈ 135 crédits restants ne figurent dans aucune de ces sources : essais de prise en main,
appels de contrôle du quota, sessions interrompues dont le flux est perdu (8 entrées du journal de
routage ont dû être reconstruites après un `reset`).

### Par modèle

| Modèle            | Usage                 | Tentatives | Réussies | Taux | Crédits |
| ----------------- | --------------------- | ---------: | -------: | ---: | ------: |
| claude-opus-5.5   | tâches hard           |         29 |       21 | 72 % |  245,82 |
|                   | revues                |         19 |        — |    — |   71,40 |
|                   | chef de lot (ds-lead) |          2 |        — |    — |  337,31 |
| claude-sonnet-5.5 | tâches std            |         57 |       38 | 67 % |  165,90 |
| claude-haiku-4.5  | tâches light          |         11 |        8 | 73 % |   11,83 |
| qwen3-coder-next  | tâches mech           |          7 |        4 | 57 % |    5,26 |
| gpt-5.6-terra     | revues croisées       |         15 |        — |    — |   27,84 |

Opus au total : ≈ 655 crédits (76 % du tracé), dont plus de la moitié en sessions de chef de lot.

### Tâches

- **70 tâches confiées à Kiro, 66 abouties** (94 %). Non abouties : T2.11 (défaut d'a11y hors de
  son périmètre, repris par l'orchestrateur) ; T8.17 et T8.22, abandonnées pour un critère
  d'acceptation faux (le bit exécutable de T8.22 a été posé dans les changements partagés de L8) ;
  T6.02, refusée par le profil des exécutants (écriture dans `tools/**`), réécrite en T6.12.
- Causes des 34 tentatives ratées : acceptation en échec 28 (taille > 120 lignes, formatage,
  export manquant, base déjà rouge, critère faux), aucun fichier modifié 4 (refus de permission),
  agent introuvable 1, inconnue 1.
- Tâches faites par l'orchestrateur après l'arrêt de Kiro : 8 en L6 (T6.04 à T6.10, T6.12),
  7 en L7, plus les corrections issues des relectures.

### Leçons de routage

1. **Le pilotage coûte plus que l'exécution.** ds-lead a dépensé 257 crédits pour piloter L8,
   contre 157 d'exécution et 38 de revues. Un chef de lot Opus ne se justifie que sur un lot long
   et peu supervisé ; ici l'orchestrateur découpait et validait déjà.
2. **Opus pour le raisonnement, pas pour le volume.** Les escalades Opus dues à la seule limite
   de 120 lignes ou au formatage (T2.04 : 23 crédits, dont une trentaine de retouches Prettier)
   sont perdues : formater avant l'acceptation (D-006), exclure les fichiers générés de Prettier
   (D-011), demander dans l'énoncé de découper au-delà de ~100 lignes.
3. **Énoncés exacts.** Exports non déclarés, acceptation incomplète (taille, ESLint,
   `astro check`), critères faux et base rouge expliquent la plupart des échecs ; le contrôle
   préalable de la base (D-015) et les exports déclarés en tête de lot les ont fait disparaître.
4. **Petits modèles, sortie vérifiée par script.** Haiku et Qwen ont fait les tâches mécaniques
   (tokens, fragments de registre, corrections ciblées) pour moins de 2 % des crédits ; un
   `meta.tokens` inventé en L3 rappelle qu'il faut recalculer ce qui peut l'être (assembleur L7).
5. **Une revue par tâche hard suffit.** Les revues ont trouvé de vrais défauts (T3.02, tâches hard
   de L6, repli des Invoker Commands en L7) ; les tâches std se contrôlent par l'acceptation.
6. **Lire `result.json` avant de supprimer un worktree** : 8,3 crédits perdus en L3.

## Actions du propriétaire

Commandes exactes dans [manual-steps.md](manual-steps.md). Dans l'ordre :

1. **Étendre les deux jetons GitHub IaC** (`GITHUB_IAC_TOKEN`, `IAC_GITHUB_READONLY_TOKEN`) au
   dépôt `PaulPerigault/design-system` (réglages GitHub, sans API).
2. **`apply` OpenTofu** des trois briques du portfolio (`infra/github`, `infra/identity`,
   `infra/`), chacune après lecture de son plan : crée `main`, les rulesets, l'environnement
   `npm-publish`, le projet Pages et `design.paulperigault.dev`.
3. **Trusted publisher npm** pour les cinq paquets (avec une `0.0.0` d'amorce si la page de
   réglages n'existe pas encore), workflow `release.yml`, environnement `npm-publish`.
4. **Fusions vers `main`** : une PR `develop → main` par release, puis la PR de release-please.
5. Ensuite : L9 (migration du portfolio vers `next`), reprise par l'assistant.

## PR

| Dépôt         | PR                     | État                                                 |
| ------------- | ---------------------- | ---------------------------------------------------- |
| design-system | #1 à #7, #9, #10, #11  | fusionnées dans `develop`                            |
| design-system | #8                     | fermée (remplacée par #9 : sujets de commit refusés) |
| portfolio     | #263, #265, #267, #269 | fusionnées dans `develop`                            |
| portfolio     | #264                   | fermée (sonde temporaire)                            |
| portfolio     | #270                   | fusionnée : empreintes du favicon                    |
| portfolio     | #271                   | `vite` 8.3.5 (avis de sécurité du 2026-10-21)        |

## Reste à faire hors L9

- Tableaux de propriétés de la doc : 28 pages à passer sur un composant commun bâti sur `Table`.
- Règle `physical-property` étendue aux classes Tailwind physiques (`ml-*`, `text-left`…).
- Mineurs de L6 : `sizes` du dialogue d'agrandissement, collision d'identifiants entre deux
  galeries aux préfixes proches, cache de `dominantColor` en `astro dev`.

## Phase 2 : état au 2026-10-21 (arrêt demandé)

- L10 (#13) et L11 (#14) fusionnés dans `develop`.
- L12 en cours sur `lot/L12`, poussée, non fusionnée : T12.01 à T12.05 faites (matrice de
  13 appareils, reflow, focus, `enterkeyhint`, menu mobile).
- Tâche en cours : T12.06 (préchargement de la police du corps et test de performance sous CPU ×4
  et Slow 4G), **non commencée dans le code**. Suivantes : T12.07 régression visuelle en CI, bilan,
  PR ; puis L13 et L14.
- Vérifier : `git switch lot/L12 && npm ci && npm run verify && npm run build && npx playwright
test -c apps/docs/playwright.config.ts`.

## Lot L20 (2026-10-24) : Open Graph, domaine, liens croisés

- 65 images `dist/og/*.png` (1200×630, identité Encre, contraste testé) ; échec si une balise `og:image` pointe vers un fichier absent.
- Domaine `design.paulperigault.dev` partout ; `registry.json` et `docs.json` régénérés.
- `rel="author"`, `sameAs`, JSON-LD contrôlés sur 66 pages ; réciprocité du portfolio sous `PORTFOLIO_LINK_CHECK=1`.
- Vérifié : `npm run verify`, Playwright chromium (664 réussis, 1 sauté). Non vérifié : rendu des images sous Linux, test réciproque réel.
- À faire par le propriétaire : DNS et projet Pages pour `design.paulperigault.dev` ; lien retour sur paulperigault.fr. Décision D-026.
