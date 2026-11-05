# Gouvernance du dépôt

État au 2026-11-04. Décision : D-160. Mesures : `docs/audit-proprete-2026-11.md`. Ce texte fixe qui décide quoi et comment une demande devient un changement fusionné. Il ne répète ni les modèles (`templates.md`) ni la mise en place GitHub (`github-setup.md`) ni les règles de code (`AGENTS.md`) : il y renvoie.

## Rôles

Le projet a un seul propriétaire, Paul. Les trois rôles d'une équipe existent quand même, tenus par des personnes ou des agents différents selon le moment.

| Rôle       | Question tranchée                              | Tenu par                                             | Décide par écrit dans                    |
| ---------- | ---------------------------------------------- | ---------------------------------------------------- | ---------------------------------------- |
| PO         | Quoi, pour qui, dans quel ordre, quand         | Paul                                                 | issue (jalon, priorité, dates), Project  |
| Tech lead  | Comment, avec quelle qualité, quand c'est fini | Paul ; Claude Code (orchestrateur) pour la relecture | PR, `AGENTS.md`, `docs/decisions-log.md` |
| Architecte | Quelle structure, quelles dépendances          | Paul ; un agent peut proposer, jamais trancher       | `docs/adr/`, contrôles `guards`          |

Les agents (Claude Code, Kiro) exécutent et proposent. Ils ne fusionnent pas la PR de release-please, ne publient rien, ne modifient ni réglage de dépôt ni jalon sans demande. Un choix qui revient à Paul est noté dans `tmp/questions-paul.md` avec options et recommandation (ligne ⚖️), jamais décidé par défaut.

## Cycle de vie d'une issue

Le champ `Status` du Project 13 porte l'état. Valeurs réelles : `A trier`, `Pret`, `En cours`, `En revue`, `Fait`.

| État     | Entrée quand                                   | Sortie quand                                     |
| -------- | ---------------------------------------------- | ------------------------------------------------ |
| A trier  | l'issue est créée (par formulaire, complète)   | le PO lui donne jalon, priorité, taille et dates |
| Pret     | la définition de prêt est remplie              | une branche est ouverte                          |
| En cours | la branche `<type>/<n>-<sujet>` existe         | la PR est ouverte                                |
| En revue | la PR est ouverte, CI en cours ou relecture    | la PR est fusionnée                              |
| Fait     | la dernière PR est fusionnée et l'issue fermée | (état final)                                     |

Une issue fermée est toujours à `Fait`, même fermée sans travail (raison `not planned` écrite dans la description). L'automatisme « item fermé → Fait » du Project est une étape manuelle (`docs/manual-steps.md` §7.4) ; tant qu'il manque, l'état se corrige à la fermeture.

## Définition de prêt

Une issue passe à `Pret` quand elle porte, sans zone vide :

- un contexte daté et sourcé (étape, ADR, mesure) et un objectif vérifiable ;
- des critères d'acceptation en cases, la commande d'acceptation en premier ;
- les fichiers autorisés pour une tâche déléguée ;
- assignee, labels `type:`, `pkg:`, `taille:`, `prio:`, jalon, entrée dans le Project ;
- `Début` et `Échéance`. Fermée : dates **factuelles** (création, fermeture). Ouverte : dates **estimées**, le mot « estimation » écrit dans l'issue et `"kind": "estimate"` dans `.github/roadmap-dates.json` ;
- un parent si l'issue fait partie d'un chantier (lien de sous-issue, pas seulement une mention).

## Définition de fini

Une issue est finie quand :

- ses cases sont toutes cochées, une par une, avec la preuve (sortie de commande, lien de PR) ;
- la dernière PR porte `Closes #n` en première ligne, une seule fois ; les PR précédentes portent `Refs #n` ;
- `npm run verify` est vert en CI, hors l'échec local connu de `format:check` sur `tmp/` ;
- le journal du jour a son entrée et la ligne D-xxx existe si un choix a été fait ;
- un parent se ferme seulement quand toutes ses sous-issues sont fermées et que ses cases sont cochées.

## Règle de traçabilité

Chaîne obligatoire : **issue → branche → commits → PR → Project**. Aucun maillon facultatif.

1. **Issue** datée, avec jalon, dans le Project, dates posées (voir « Définition de prêt »).
2. **Branche** `<type>/<n>-<sujet>`, où `<type>` est un type Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`) et `<n>` le numéro de l'issue. Les anciens noms de `github-setup.md` (`fonction/`, `tache/`) sont abandonnés : 103 des 161 PR suivent déjà la forme `<type>/<n>-`.
3. **Commits** en Conventional Commits, minuscules, 72 caractères au plus, sans signature d'outil.
4. **PR** vers `main` : `Closes #n` ou `Refs #n` dans le corps, ajoutée au Project, fusion squash avec `--subject` et `--body-file`. Sujet de squash avec « (#n) » écrit dans `--subject`, 72 caractères au plus suffixe compris, mesurés sur le texte après `type(scope): ` (décisions Q22 et Q32 de Paul, `AGENTS.md`).
5. **Aucune réécriture d'historique** : un écart ancien se documente (`docs/history/catch-up.md`, rapport d'audit), il ne se corrige pas par `rebase`.

Contrôle : `npm run audit:traceability` affiche les écarts sans jamais échouer. Une PR de release-please ou de Dependabot est exemptée (aucune issue par conception).

## Labels

Source unique : `.github/labels.json` (32 labels, synchronisés par `node tools/github/sync-labels.mjs`). Jamais de label créé à la main.

| Préfixe   | Sens                                                              | Obligatoire |
| --------- | ----------------------------------------------------------------- | ----------- |
| `type:`   | nature du travail (tâche, bogue, fonction, chantier…)             | oui         |
| `pkg:`    | paquet ou zone concernée                                          | oui         |
| `taille:` | `trait` (30 minutes), `page` (une session), `cahier` (à découper) | oui         |
| `prio:`   | `bloquant`, `haute`, `normale`, `basse`                           | oui         |
| `etat:`   | `a-valider`, `bloque` : attente d'une décision de Paul            | non         |

## Roadmap : cadence de revue

La vue Roadmap du Project (réglages : `github-setup.md`) lit `Début` et `Échéance`, regroupés par jalon.

- **Chaque jour de travail**, en fin de journée : les issues fermées passent à `Fait`, celles du lendemain ont des dates.
- **Chaque semaine** : relecture des jalons. Une échéance estimée qui glisse est réécrite avec sa raison, pas effacée.
- **À chaque jalon** : bilan dans `docs/lots/` ou `docs/run-report.md` (fin de jalon seulement), puis jalon fermé.
- **Chaque mois** : contrôle des skills tiers (`skills-amont.yml`), des dépendances (Dependabot, `docs/process/dependabot.md`) et de cet audit (`audit:traceability`, `audit:comments`).

## Décisions : où écrire quoi

| Nature                                          | Lieu                         | Forme                                                         |
| ----------------------------------------------- | ---------------------------- | ------------------------------------------------------------- |
| Structure durable, dépendances, frontières      | `docs/adr/NNNN-*.md`         | une ADR numérotée, jamais supprimée                           |
| Choix ponctuel (option retenue, option écartée) | `docs/decisions-log.md`      | une ligne D-xxx : date, décision, alternative, retour arrière |
| Ce qui a été fait, par PR                       | `docs/journal/AAAA-MM-JJ.md` | une entrée par PR, mise à jour avec la PR                     |
| État de fin de jalon                            | `docs/run-report.md`         | fin de jalon seulement                                        |
| Question en attente de Paul                     | `tmp/questions-paul.md`      | local, jamais commité                                         |

Une ADR pose la règle ; une ligne D-xxx dit pourquoi un choix a été fait un jour donné. Le code ne porte pas l'histoire de la décision : un commentaire décrit le code (valeur, unité, contrainte, norme) et renvoie à une ADR seulement pour une valeur qu'elle définit.

## Ce qui est automatisé et ce qui ne l'est pas

| Automatique (CI)                                        | À la main                                      |
| ------------------------------------------------------- | ---------------------------------------------- |
| commitlint, taille de fichier, couches, tokens, secrets | choix de jalon et de priorité                  |
| `check:issue-templates` (formulaires cohérents)         | dates estimées, réglages de la vue Roadmap     |
| ruleset `main` (PR, squash, historique linéaire)        | fusion de la PR de release-please, publication |
| `audit:traceability` (affiche, ne bloque pas)           | fermeture des parents, relecture des cases     |
