# AGENTS.md — règles communes (Kiro, Claude Code, humains)

Source unique des règles de ce dépôt. `CLAUDE.md` l'importe, `.kiro/steering/ds.md` y renvoie.

## Projet

Design system de paulperigault.fr, monorepo npm workspaces, Node 24, npm 11, licence MIT.

| Paquet                  | Rôle                                                                                                                    | Dépend de          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `@paulperigault/tokens` | source DTCG 2025.10 → `tokens.css`, `tokens.json`, `tokens.d.ts` ; `color` (OKLCH ↔ sRGB, gamut) et `contrast` (WCAG 2) | rien à l'exécution |
| `@paulperigault/css`    | base, reset, impression, polices, `@theme` Tailwind v4, primitives de layout CSS                                        | `tokens`           |
| `@paulperigault/astro`  | composants `.astro` publiés en source, behaviors, `variants()`                                                          | `css`, `tokens`    |
| `@paulperigault/guards` | contrôles (taille, couleurs, couches, tokens, images), config ESLint                                                    | rien à l'exécution |
| `@paulperigault/create` | CLI `create`, `add`, `eject`, `diff` (`node:util` parseArgs, FS injecté)                                                | rien à l'exécution |
| `@paulperigault/mcp`    | serveur MCP stdio en lecture seule (7 outils), données embarquées, aucun accès réseau                                   | `tokens`, `guards` |
| `apps/docs`             | documentation vivante, design.paulperigault.dev                                                                         | tous               |

Sens unique : `tokens ← css ← astro`. Un import qui remonte ce sens est une erreur.

## Limites (vérifiées en CI)

- Fichier ≤ 120 lignes (`.ts`, `.astro`, `.css`, `.mjs`) : on découpe, on ne relève jamais la limite.
- Fonction ≤ 40 lignes, complexité ≤ 8, profondeur ≤ 3, ≤ 4 paramètres, ≤ 3 callbacks imbriqués.
- Aucun nombre magique hors tests et fichiers de config ; aucun `any` ; aucun `console` hors `tools/` et scripts.
- `import type` pour les types ; Prettier : guillemets simples, points-virgules, 100 colonnes.
- Une brique = un test au minimum. Logique pure + dépendances injectées (FS, process, horloge, `fetch`).
- Tout style passe par les tokens `--pp-*` : aucune couleur, taille, espacement, rayon ou durée brute.
- Composants : propriétés logiques (`inline`, `block`), cibles ≥ `--pp-target-min`, zéro JS par défaut.
- **Aucun attribut `style` en ligne** : les sites consommateurs ont une CSP stricte (`style-src` par
  hashes, sans `unsafe-inline`), qui l'ignore. Variantes par attribut `data-*` ou classe, mappées en CSS.
- Liste stylée sans puces (`list-style: none` sur `ul`/`ol`) : `role="list"` explicite (VoiceOver
  retire sinon la sémantique de liste). Tout repère `nav` en double porte un nom (`aria-label`).
- CSS scopé d'Astro : il n'atteint pas les enfants passés par `<slot />`. Les viser avec `:global()`
  sous la racine du composant (`.pp-stack > :global(* + *)`), et tester le CSS produit.

## Règle éditoriale

« Prouvé » seulement si une source l'établit (citer auteur, année, revue ou norme) ; sinon « convention » ou « préférence ». Pas de formule creuse : des faits.

## Interdits « anti-IA » (sauf décision écrite et motivée dans une ADR)

Dégradés décoratifs, ombres décoratives, flou (`backdrop-filter`), emoji, étiquettes en majuscules espacées, palette Tailwind par défaut, valeurs arbitraires (`p-[13px]`), effets terminal vert sur noir, scanlines, glitch, machine à écrire, phrases génériques (« passionné par », « solutions innovantes »…).

## Commandes de vérification

```
npm run verify                          # tout : guards, lint, format, tests, build, npm pack --dry-run
npm test                                # Vitest, tous les projets
npx vitest run --project astro          # un paquet
npm -w @paulperigault/docs run build    # documentation
npm run check:size                      # limite de 120 lignes
npm run check:lockfile                  # npmjs uniquement, aucune dépendance file:/link:
npm run registry                        # régénère meta.tokens des fragments et registry.json
npm run check:registry                  # registre à jour, chaque export .astro a son fragment
```

## Format d'une tâche (`tasks/<id>-<slug>.md`)

```markdown
---
id: T3.02
title: Cluster
engine: kiro # kiro | claude
agent: ds-worker # ds-worker | ds-reviewer
tier: std # mech | light | std | hard | xreview
effort: medium
files: # propriété EXCLUSIVE : tout autre fichier modifié = échec
  - packages/astro/src/layout/Cluster.astro
acceptance:
  - npx vitest run --project astro
depends_on: [T1.01]
---

Énoncé, contraintes, critères. Pas d'historique de conversation.
```

## Interdits des exécutants (agents)

- Ne jamais `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, créer ou changer de branche.
- Ne jamais `npm publish` (même `--dry-run`), `npm install <paquet>`, modifier `package.json` ou `package-lock.json` sauf si la tâche les liste dans `files:`.
- Aucun accès réseau hors registre npm ; aucun secret, jeton ou variable d'environnement sensible lu ou écrit.
- N'écrire que les fichiers de `files:`. Les fichiers partagés (`registry.json`, `index.ts`, `exports`, `docs/test-matrix.md`) appartiennent à l'orchestrateur.
- Ne pas lancer d'autre agent ni de sous-agent.
- Terminer par : fichiers modifiés, sorties des commandes d'acceptation, 3 lignes « ce qui reste incertain ».

## Git

`develop` = intégration (PR squash par lot, par l'orchestrateur seul). `main` = production, fusions par le propriétaire uniquement. Conventional Commits, sujet en minuscules ≤ 72 caractères, aucune signature d'outil (`Co-authored-by`, « Generated with » : refusés par commitlint, sans exemption).

Fusion d'une PR (squash : le message = titre + corps de la PR, jamais la liste des commits) :

```
gh pr merge <n> --squash --delete-branch --subject "<titre>" --body-file <fichier du corps>
```

Titre ≤ 72 caractères sans `(#n)` (GitHub l'ajoute), corps ≤ 90 colonnes par ligne. Sans `--subject`
et `--body-file`, GitHub reprend la liste des commits et `squash-message` échoue sur `develop`.

## Coordination (orchestrateur et ds-lead)

Plafond global de sessions Kiro (`.agents/slots/`), une seule tâche lourde locale à la fois
(`.agents/locks/heavy`), dépendances des worktrees clonées depuis une amorce (`.agents/seeds/`).
ds-lead : `prompts/lead.md`, file `.agents/lead-queue.md`, moteur `tools/agents/lead.mjs`.

## Décisions et journal

ADR dans `docs/adr/`, choix ouverts dans `docs/decisions-log.md`, journal daté dans `docs/journal/`, bilan dans `docs/run-report.md`.

## GitHub (règle opérationnelle)

- Chaque PR référence son issue (`Closes #n`). Chaîne : issue → branche `<type>/<n>-<slug>` → commits →
  PR → Project.
- Les labels viennent de `.github/labels.json` (`node tools/github/sync-labels.mjs`, `--apply` pour
  agir) : ne jamais en créer à la main.
- Claude Code ne poste aucun commentaire dans les issues ni les PR : les informations vont dans la
  description ou le journal.
