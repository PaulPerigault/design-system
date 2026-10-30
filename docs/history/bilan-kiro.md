# Historique : bilan Kiro et leçons de routage

Déplacé tel quel depuis `docs/run-report.md` (D-080).

**Crédits Kiro depuis la reprise (23 octobre) : ≈ 250 tracés sur ≈ 870.** haiku-5.5 : 17 tâches, 14 ;
sonnet-5.5 : 19, 103 ; opus-5.5 : 2, 133 (T14.05 : 102 ; Combobox : 31). Les paliers mech et light font
45 % des tentatives, sous la cible de 50 % : les composants à comportement clavier ont demandé
sonnet ou opus. Les revues croisées de Combobox n'ont rendu aucun verdict (permissions refusées en
mode non interactif) ; relue par l'orchestrateur. Consommation réelle côté Kiro : non mesurée.

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
