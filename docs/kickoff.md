# Kickoff : design system @paulperigault
# Claude Code (Opus 5.5) orchestre · Kiro CLI (Sonnet 5.5 / Opus 5.5) exécute

> À coller dans Claude Code, lancé depuis le terminal de WebStorm, à la racine du dossier qui contiendra le nouveau dépôt.
> Référence de fond : le rapport « Design system à la shadcn pour paulperigault.fr » (preuves, tokens, composants, plan E0–E8). Ce document le **complète et le modifie** sur deux points : le design system devient un **vrai package npm**, et l'exécution passe par **Kiro CLI piloté par script** (headless si la session le permet, sinon ACP).

---

## 0. Ton rôle et tes règles

Tu es l'**orchestrateur**. Tu ne codes toi-même que ce qui est structurant : squelette, tokens provisoires, dispatcher, revues, fusions et commits. Tout le reste passe par des **tâches atomiques** exécutées par Kiro.

Règles non négociables :
- Code de niveau senior, maintenable, en briques indépendantes. Fichier ≤ 120 lignes, fonction ≤ 40, complexité ≤ 8, pas de nombre magique, un test par brique.
- **Aucune signature d'outil** dans les commits et les PR : pas de trailer `Co-Authored-By`, pas de mention « Generated with ». Désactive l'attribution dans tes réglages et ajoute une règle commitlint qui refuse ces lignes ; c'est commitlint qui fait foi.
- Les exécutants **ne committent jamais, ne poussent jamais, ne publient jamais**. Toi seul commits, après revue.
- Règle éditoriale : « prouvé » seulement pour ce qu'une source établit ; sinon « convention » ou « préférence ».
- L'identité visuelle (ADR-0008) n'est **pas** dans ce lot. Tokens provisoires = palette actuelle du portfolio, et tout passe par les tokens. Le re-skin final ne touchera donc que `packages/tokens`.

---

## 1. Architecture : un vrai package, pas un dossier

### 1.1 Dépôt dédié `PaulPerigault/design-system` (monorepo npm workspaces)

```
design-system/
  AGENTS.md                 # source unique des règles agents (lue par Kiro ET par toi via CLAUDE.md)
  CLAUDE.md                 # @AGENTS.md + consignes d'orchestration
  .kiro/agents/*.json       # agents exécutants
  .kiro/steering/ds.md      # renvoie vers AGENTS.md, rien d'autre
  .claude/agents/ds-reviewer.md
  tasks/                    # une tâche = un fichier Markdown (format §3.2), agnostique du moteur
  tools/agents/             # dispatcher (Node, testé)
  packages/
    tokens/   @paulperigault/tokens   # source DTCG 2025.10 → css, json, d.ts ; aucune dépendance runtime
    css/      @paulperigault/css      # base, reset, print, fonts, @theme Tailwind v4, primitives de layout CSS
    astro/    @paulperigault/astro    # composants .astro publiés en source, behaviors, lib (variants, contrast, color)
    guards/   @paulperigault/guards   # check-design, check-size, check-layers, check-tokens, check-images, config ESLint
    create/   @paulperigault/create   # CLI : create, add, eject, diff (node:util parseArgs, FS injecté)
  apps/
    docs/                   # styleguide Astro = documentation vivante (design.paulperigault.dev, Cloudflare Pages, IaC)
```

Dépendances à sens unique : `tokens` ← `css` ← `astro` ; `guards` et `create` ne dépendent d'aucun autre paquet à l'exécution. La séparation sert aussi les futurs projets non Astro : ils consomment `tokens` + `css` + `guards`. Un `@paulperigault/react` ne viendra que si un vrai besoin apparaît.

### 1.2 Consommation : « tout passe par le design system »

- **Mode par défaut = import du paquet**, pas copie : `npm i @paulperigault/astro @paulperigault/css` ; mises à jour par semver.
- **Mode exceptionnel = `eject`** : `npx @paulperigault/create eject Button` copie la source dans le projet et l'inscrit dans `pp-ds.lock.json` (version + sha256). `diff` compare la copie au paquet. C'est ce qui reste du modèle shadcn.
- `registry.json` (schéma shadcn) est conservé comme **métadonnées** : docs, CLI, liste des tokens requis par élément.
- Chaque site consommateur exécute `@paulperigault/guards` dans son `verify` : couleurs, tailles, espacements, rayons et durées bruts interdits hors tokens ; `<img>` brut interdit (voir §4).
- Composants publiés en `.astro` source (Astro ne précompile pas) : `exports` explicites par fichier + un `index.ts`. Vérifier dans le portfolio si `vite.ssr.noExternal: ['@paulperigault/astro']` est nécessaire.

### 1.3 Publication

- Registre **npmjs public**. Pas GitHub Packages : son registre npm exige un jeton même pour installer un paquet public, ce qui casse `npx @paulperigault/create`.
- **Trusted publishing (OIDC) depuis GitHub Actions + provenance** : aucun `NPM_TOKEN` stocké.
- Versionnage : release-please en mode manifest monorepo (cohérent avec le portfolio), un CHANGELOG par paquet.
- Interdiction de publier en local : seul le workflow `release` publie.
- Développement croisé : l'app `apps/docs` est la surface de développement. Le portfolio consomme des versions publiées (dist-tag `next` pour les préversions). Un garde-fou CI refuse toute dépendance `file:` ou `link:` sur `main`.

---

## 1.4 Infrastructure : tout en IaC, rien à la main

Pour ne rien bloquer, le dépôt est **créé en L0 avec `gh repo create`** (public, branche `develop`), puis **adopté par OpenTofu** grâce à des blocs `import` dans la stack `infra/` du portfolio. Cette stack arrive par une PR dans le portfolio. L'`apply` de Paul peut venir plus tard sans rien casser : il ajoute les rulesets, Pages et le DNS, et tu poursuis le travail en attendant. Une fois adoptés, sont gérés en code :
- le dépôt lui-même ;
- les branches `main` et `develop` et les rulesets ;
- les checks requis ;
- les réglages Actions ;
- l'environnement `npm-publish` protégé ;
- le projet Cloudflare Pages des docs et l'enregistrement DNS `design.paulperigault.dev`.

Règles :
- Ne modifie **jamais** à la main un réglage GitHub ou Cloudflare de ce dépôt : toute modification passe par `infra/` du portfolio.
- Tu écris l'IaC et tu exécutes `tofu plan`. **Paul fait `tofu apply`** depuis la machine qui détient ses secrets IaC.
- Seuls deux réglages restent hors IaC : la connexion Kiro (`kiro-cli login`) et le trusted publisher npm. Aucun fournisseur fiable n'existe pour eux ; ils sont faits par Paul et décrits dans `docs/manual-steps.md`.

## 2. Vérifications préalables (à faire en premier, avant toute tâche)

Arrête-toi et rapporte à Paul si l'un de ces points échoue :

1. `kiro-cli --version` ≥ 2.31 ; `kiro-cli whoami`.
2. **Mode d'accès à Kiro** : Paul n'a pas de clé API, mais une session ouverte par `kiro-cli login` sur son compte à crédits offerts. Paul a déjà fait le test ci-dessous ; relève son résultat et choisis le transport du dispatcher en conséquence :
   - `kiro-cli chat --v3 --no-interactive "Réponds uniquement OK"` répond → **transport `headless`**, authentifié par la session, sans `KIRO_API_KEY`.
   - Ce test échoue faute de clé API → **transport `acp`** : le dispatcher lance `kiro-cli acp --agent <agent>` et lui parle en JSON-RPC sur stdio : `initialize`, `session/new` (`cwd` = worktree), réglage du modèle, `session/prompt`, collecte des `session/update` jusqu'à la réponse du prompt. Les demandes de permission sont décidées par une politique écrite dans le dispatcher : accord seulement pour la lecture, l'écriture dans `files:` et les commandes d'acceptation ; refus pour tout le reste. Vérifie les noms exacts des méthodes et le format des demandes de permission dans la doc ACP de la version installée (V3 vs v2). Module isolé `tools/agents/acp-client.mjs`, ≤ 120 lignes par fichier, testé avec un faux processus.
   - Les deux échouent → toutes les tâches passent en `engine: claude` et Paul garde Kiro pour un usage manuel.
   Si une clé API existe un jour : Trousseau macOS uniquement, jamais dans un fichier, un `.env` ou un log.
3. `kiro-cli chat --list-models --format json` : relever les **identifiants exacts** de Sonnet 5.5 et Opus 5.5, puis les écrire dans `tools/agents/models.json`. Ne jamais deviner un identifiant.
4. Disponibilité du scope npm `@paulperigault` (`npm view @paulperigault/tokens` doit renvoyer 404 ; `npm whoami`).
5. Réglages d'attribution des commits désactivés côté Claude Code ; commitlint en place.

---

## 3. Orchestration

### 3.1 Contexte partagé

- `AGENTS.md` (≤ 150 lignes) : architecture, couches, limites, règle éditoriale, interdits « anti-IA », commandes de vérification par paquet, format de tâche, interdits des exécutants (commit, push, publish, réseau hors registre npm, écriture hors `files:`).
- `CLAUDE.md` = `@AGENTS.md` + consignes d'orchestration de ce document.
- `.kiro/steering/ds.md` : une ligne qui renvoie vers `AGENTS.md`. Kiro lit aussi `AGENTS.md` à la racine. Une seule source, pas de dérive.

### 3.2 Format de tâche (`tasks/T5.04-select.md`)

```markdown
---
id: T5.04
title: Select natif
engine: kiro            # kiro | claude (repli)
agent: ds-worker        # ds-worker | ds-reviewer
tier: std               # mech | light | std | hard | xreview (§3.3 bis) → résolu via tools/agents/models.json
effort: medium
files:                  # propriété EXCLUSIVE ; tout fichier modifié hors liste = échec
  - packages/astro/src/primitives/Select.astro
  - packages/astro/test/Select.test.ts
  - apps/docs/src/pages/components/select.astro
  - packages/astro/registry/items/select.json
acceptance:
  - npm -w @paulperigault/astro run verify
  - npx playwright test -c apps/docs --grep select
depends_on: [T4.01, T5.08]
---
Contexte minimal, contraintes, critères. Pas d'historique de conversation.
```

### 3.3 Agents Kiro (`.kiro/agents/`)

- `ds-worker.json` : modèle par défaut `claude-sonnet-5.5` (remplacé par tâche via `--model`), outils lecture/écriture/shell, `resources` = `file://AGENTS.md` + skills du dépôt, prompt dans `prompts/worker.md`.
- `ds-reviewer.json` : modèle par défaut `claude-opus-5.5`, **lecture seule + exécution des tests**. Rend `APPROUVÉ` ou `CHANGEMENTS REQUIS` avec une liste `fichier:ligne`.
- Pas de sous-agents Kiro : un exécutant fait une tâche. **Un seul niveau d'orchestration (toi)**, pour garder un coût et une traçabilité prévisibles.
- Valider chaque fichier avec `kiro-cli agent validate --path …`. Noms d'outils et champs exacts : se fier à la référence de configuration de la version installée.
- Hooks `PreToolUse` côté Kiro : refuser `git commit|push`, `npm publish`, toute écriture hors du worktree et tout accès réseau hors registre npm. Les hooks doivent rendre une décision finale (allow/deny).

### 3.3 bis Routage des modèles (tu décides, tâche par tâche)

Les agents Kiro sont définis par **rôle** (`ds-worker`, `ds-reviewer`). Le **modèle** se choisit par tâche via `--model`, qui prime sur celui de l'agent. Les identifiants vérifiés par Paul vont dans `tools/agents/models.json` :

| Palier | Identifiant Kiro | Coût | Usage |
|---|---|---|---|
| `mech` | `qwen3-coder-next` (repli `deepseek-3.2`) | 0,05x (0,25x) | Mécanique pure : fragments de registre JSON, pages de doc calquées sur un gabarit, renommages, lignes de `test-matrix` |
| `light` | `claude-haiku-4.5` | 0,4x | Doc rédigée, exemples du styleguide, tests simples à partir d'un modèle existant |
| `std` | `claude-sonnet-5.5` | 1,3x | Défaut : primitives, composants, tests de rendu, e2e |
| `hard` | `claude-opus-5.5` (repli `claude-opus-5`) | 2,0x (2,2x) | Générateur de tokens, color/contrast, Dialog, Field, Select, pipeline d'images, CLI, revues |
| `xreview` | `gpt-5.6-terra` | 2,2x | Revue croisée d'un autre éditeur, sur les tâches `hard` uniquement |

Règles :
- **Escalade automatique** : un échec d'acceptation fait monter d'un palier (`mech` → `std` → `hard`), puis vient vers toi. On ne relance jamais deux fois au même palier.
- **Désescalade apprise** : après 5 réussites consécutives d'un type de tâche dans un palier, essaie le palier inférieur sur le type suivant. Si ça échoue, reviens au palier précédent pour le reste du lot.
- Consigne chaque décision (tâche, palier, raison, résultat) dans `.agents/routing-log.jsonl`. Résumé dans le rapport final.
- **Crédits** : si le flux `stream-json` expose la consommation, cumule-la dans le log. Sur une erreur de quota ou de crédits, bascule automatiquement toutes les tâches restantes en `engine: claude` (tes sous-agents Sonnet) et continue.

### 3.4 Dispatcher `tools/agents/` (Node 24, sans dépendance, testé avec FS et process injectés)

`node tools/agents/run.mjs tasks/T5.04-select.md` :
1. Vérifie que les tâches de `depends_on` sont fusionnées.
2. `git worktree add ../ds-wt/T5.04 -b agent/T5.04` depuis `develop`.
3. Lance Kiro selon le transport retenu au §2, sans jamais injecter de secret (la session `kiro-cli login` suffit) :
   - `headless` : `kiro-cli chat --v3 --no-interactive --agent <agent> --model <id> --effort <e> --output-format stream-json --sandbox --require-mcp-startup`, prompt passé **par stdin** (corps de la tâche + chemins autorisés), `cwd` = worktree, délai maximal 30 min ;
   - `acp` : même contenu envoyé via `tools/agents/acp-client.mjs`, même délai, même journalisation.
   Le transport est une interface unique (`runAgent(task, worktree) → events`) avec deux implémentations interchangeables, choisie dans `tools/agents/config.json`.
   `--trust-all-tools` est accepté **uniquement** avec `--sandbox`, dans le worktree et avec les hooks deny. Sinon, `--trust-tools` avec les identifiants exacts.
4. Écrit le flux dans `.agents/runs/T5.04.jsonl` (ignoré par git). Gère les codes de sortie : 3 = MCP en échec, 4 = agent introuvable, autre ≠ 0 = échec.
5. Exécute chaque commande `acceptance` dans le worktree.
6. **Contrôle de propriété** : `git diff --name-only` doit être inclus dans `files:`. Tout fichier hors liste = échec, sans revue.
7. Écrit `.agents/runs/T5.04.result.json` : `{status, filesTouched, outOfScope, acceptance:[{cmd, code}], durationMs, engine, model}`.
8. `--engine claude` : même tâche via `claude -p` avec un sous-agent Sonnet. C'est le repli si aucun transport Kiro ne fonctionne ou si les crédits sont épuisés.

`node tools/agents/batch.mjs --lot L2 --parallel 3` : lance un lot en respectant `depends_on`, au plus N en parallèle, et rend un tableau récapitulatif. Commencer à `--parallel 3`, puis monter seulement si aucune erreur de quota n'apparaît.

### 3.5 Boucle de l'orchestrateur

Pour chaque tâche terminée :
1. Lire `result.json` ; si l'acceptation ou le contrôle de propriété a échoué, relancer avec le message d'erreur **au palier supérieur** (§3.3 bis), puis reprendre toi-même la tâche si le palier `hard` échoue aussi.
2. Revue : `ds-reviewer` en palier `hard` sur toutes les tâches `hard`, plus une revue `xreview` (autre éditeur) sur ces mêmes tâches ; ton sous-agent `.claude/agents/ds-reviewer.md` sur un échantillon d'une tâche sur cinq pour les autres. La revue croisée entre moteurs attrape plus d'erreurs.
3. Fusion dans `develop`, mise à jour des fichiers partagés (`registry.json`, `index.ts`, `docs/test-matrix.md`) **par toi seul**, puis commit Conventional Commits sans signature d'outil.
4. Suppression du worktree.

---

## 4. Images et photos : épique dédiée (E-IMG)

Objectif : plus aucune image n'est affichée sans passer par le design system.

**Composants** (`packages/astro/src/media/`) :
- `Photo` : enveloppe `<Picture>` d'`astro:assets`. Props typées :
  - `src: ImageMetadata` : import local obligatoire, URL distante interdite sauf liste blanche explicite ;
  - `alt: string` obligatoire, **ou** `decorative: true`, qui produit `alt=""` (union discriminée, impossible d'oublier) ;
  - `ratio` = token (`--pp-ratio-portrait|square|landscape|wide`), `focal` (→ `object-position`) ;
  - `priority` : image LCP → `loading="eager"` + `fetchpriority="high"` ; sinon `lazy` + `decoding="async"` ;
  - `sizes` issu d'un preset de layout (pas de chaîne libre) ;
  - `width`/`height` toujours rendus (CLS nul).
- `Figure` (`<figure>` + `<figcaption>` + crédit), `Avatar`, `ProjectCover`, `Gallery` (grille en container queries ; agrandissement facultatif via `<dialog>`, navigable au clavier, zéro JS par défaut), `ArtDirection` (`<picture>` avec sources `media` pour un recadrage mobile).

**Pipeline** (build statique, sharp) : AVIF + WebP + repli, largeurs dérivées des tokens de layout, qualité par type (photo / capture d'écran / illustration). Placeholder = **couleur dominante** calculée au build et posée en `background-color`. Pas de flou : cohérent avec les interdits anti-IA.

**Tokens** : ratios, rayon média, filet média, couleur de placeholder par défaut, budget de poids par usage (hero, carte, galerie).

**Garde-fous** (`@paulperigault/guards`, `check-images`) :
- `<img>` brut et `background-image` d'URL interdits hors `packages/astro/src/media/` ;
- aucune image versionnée ne contient de métadonnées EXIF/GPS (vie privée, RGPD) ; échec avec le chemin et la commande de nettoyage ;
- budget de poids par fichier source et par variante générée ;
- texte sur photo interdit, sauf via un composant `Scrim` dont le test calcule le contraste dans le **pire cas** (fond blanc pur sous le voile) et exige ≥ 4,5:1 ;
- e2e : axe sans violation, CLS mesuré sur les pages à images, image LCP chargée en `eager`.

**Ce qui relève de Paul** : choix du portrait canonique et de ses recadrages, et sélection des photos de projets. Fondement à citer avec mesure : les visages font l'objet de jugements de confiance en ~100 ms (Willis & Todorov, 2006, *Psychological Science*). C'est une raison de soigner le portrait, **pas** une preuve qu'une photo aide à être recruté.

---

## 5. Lots (ordre d'exécution)

La colonne « Moteur » est indicative : le routage du §3.3 bis prime.

| Lot | Contenu | Moteur | Parallélisable |
|---|---|---|---|
| L0 | Vérifications §2, squelette monorepo, CI (verify, guards, release dry-run), AGENTS.md, agents Kiro, dispatcher + tests | **Toi** | non |
| L1 | Pilote : 1 tâche simple (`Stack`) via Kiro → valider le dispatcher de bout en bout (worktree, acceptation, contrôle de propriété, result.json) et relever la consommation si `stream-json` l'expose | Kiro Sonnet | non |
| L2 | Tokens DTCG provisoires, générateur, `color.ts` OKLCH→sRGB, `contrast.ts`, tests de contraste générés, `check:tokens` | Kiro **Opus** (générateur), Sonnet (reste) | partiel |
| L3 | Primitives de layout (Stack, Cluster, Grid, Container, Sidebar, Switcher, Center), `variants()`, helper de rendu | Kiro Sonnet | oui (3) |
| L4 | Formulaires : Input, Textarea, Select, Checkbox, Radio, Switch, Field | Sonnet ; Field et Select en Opus | oui (3) |
| L5 | Retour et structure : Alert, Separator, Progress/Meter, Accordion, Dialog (Opus), Table, Breadcrumb, Prose, Status, Diff | mixte | oui (3) |
| L6 | E-IMG (§4) | Kiro **Opus** (pipeline), Sonnet (composants) | partiel |
| L7 | `apps/docs` : une page par composant, matrice axe 2 thèmes × 2 viewports, test 1.4.12, tailles de cibles | Kiro Sonnet | oui |
| L8 | `@paulperigault/guards` empaqueté + `create` (create/add/eject/diff) + job CI « générer un site → verify » | Kiro Opus | non |
| L9 | Migration du portfolio vers les paquets publiés (`next`), suppression des composants dupliqués | **Toi** + Sonnet | non |

**Budget de crédits Kiro** : après L1, calcule le coût moyen par tâche, puis le nombre de tâches finançables. Garde **15 % de réserve** pour les relances et revues. Répartition visée : ~70 % Sonnet 5.5 (exécution), ~30 % Opus 5.5 (tâches dures + revues). Si les crédits s'épuisent, bascule les tâches restantes en `engine: claude`, sans rien changer d'autre.

---

## 6. Mode autonome (Paul n'est pas là)

Tu enchaînes L0 → L9 **sans attendre Paul**. Pour chaque choix ouvert, prends l'option la plus réversible, consigne-la dans `docs/decisions-log.md` (date, décision, alternative écartée, comment revenir en arrière) et continue.

Ce que tu prépares sans l'exécuter (actions irréversibles ou qui exigent ses secrets) :
1. **`tofu apply`** de la stack `infra/` du portfolio : PR prête, plan en commentaire, commande exacte dans le rapport.
2. **Trusted publisher npm** et toute publication `latest` : workflow prêt, `npm publish --dry-run` vert. Publication en dist-tag `next` seulement si le trusted publisher existe déjà ; sinon, prépare tout et arrête cette branche du travail.
3. **Fusion dans `main`** du portfolio et du design system : PR prêtes, CI verte. Tu fusionnes dans `develop` uniquement.

Choix « humains » traités par défaut, puis signalés pour relecture (non bloquants) :
- photos : réutilise celles du portfolio, recadrages et `alt` proposés dans `docs/photos-review.md` ;
- identité (ADR-0008) : hors lot, tokens provisoires = palette actuelle.

À la fin, écris `docs/run-report.md` et ouvre-le en PR vers `develop` :
- lots terminés ;
- tâches par palier et taux de réussite ;
- crédits estimés ;
- décisions prises ;
- les 3 actions de Paul, avec les commandes exactes.

---

## Addendum 1 (2026-10-20) : prompt de lancement

Ce document prime sur le kickoff là où ils divergent. Texte intégral ci-dessous.

### Prompt de lancement : design system @paulperigault (mission complète et autonome)

Ce document est ton ordre de mission. Il prime sur `~/dev/ds-brief/kickoff-design-system.md` là où ils divergent, et le kickoff prime sur `~/dev/ds-brief/research-report.md`. Reporte ce document en addendum daté dans `docs/kickoff.md` du design system.

Si tu n'as pas encore fait la phase de vérification (plan de vol), fais-la d'abord en lecture seule, puis continue sans attendre mon feu vert : il est donné ici. Le plan de vol que tu m'as rendu est validé, y compris tes corrections :
- contrôle de propriété par SHA de base + fichiers non suivis + `HEAD == base` ;
- `color` et `contrast` dans `@paulperigault/tokens` ;
- `npm run infra:github -- plan` au lieu de `tofu` en direct ;
- ADR au prochain numéro libre ;
- `@source` Tailwind sur le paquet ;
- `npm_config_userconfig` vide pour les exécutants.

---

## 0. Seule étape où je suis présent (valide-la avec moi, puis ne me demande plus rien)

1. **Permissions.** Écris `.claude/settings.json` du portfolio, puis celui du design system dès qu'il existe, pour travailler sans me solliciter.
   - **Autorisé :**
     - git, sauf `push --force` et tout push vers `main` ;
     - `gh repo create`, `gh repo clone`, `gh pr`, `gh issue` ;
     - `kiro-cli`, `node`, `npm`, `npx` ;
     - les scripts `npm run infra:*` en `plan`, `fmt` et `validate` ;
     - l'édition dans `~/dev/PaulPerigault.githun.io`, `~/dev/design-system` et `~/dev/ds-wt`.
   - **Interdit :**
     - tout `apply` OpenTofu ;
     - `npm publish` hors `--dry-run` ;
     - toute fusion ou tout push vers `main` ;
     - toute écriture hors de ces dossiers ;
     - toute modification de `~/.npmrc` ou de `~/.claude/settings.json`.

   Montre-moi les fichiers et attends mon accord.
2. **Attribution.** `"attribution": { "commit": "", "pr": "" }` dans chaque `.claude/settings.json`. Prouve-le par un commit de test sur une branche jetable, que tu supprimes ensuite. Ajoute une règle commitlint, sans exemption, qui refuse `Co-Authored-By` et « Generated with », dans le portfolio comme dans le design system, et vérifie-la en CI sur la plage de chaque PR. Message de squash du design system = `PR_BODY`.

Dès que j'ai validé l'étape 0, tu passes en **mode autonome** jusqu'à la fin.

---

## 1. Faits établis (ne les revérifie que si une commande échoue)

- **Kiro :**
  - kiro-cli 2.32.0 (Homebrew), session IAM Identity Center ouverte par `kiro-cli login`, aucune clé API.
  - Transport : headless (`kiro-cli chat --v3 --no-interactive`), authentifié par la session. N'injecte jamais `KIRO_API_KEY`.
  - Réponse sur stdout, journaux sur stderr : garde stderr dans `.agents/runs/<id>.stderr.log` et ne parse que stdout ou le stream-json.
- **Compte Kiro :** offert par un tiers, ce n'est pas un compte WeVii. Utilise-le, mais n'y fais passer aucun secret : le profil est géré par une organisation.
- **npm :**
  - Mon `~/.npmrc` global contient la configuration du Nexus de mon employeur (`nexus.dev.wevii.net`). Ne le lis pas, ne le modifie pas, ne l'utilise jamais pour ce projet.
  - Le design system et chaque worktree ont un `.npmrc` projet forçant `https://registry.npmjs.org/`, et chaque paquet a un `publishConfig.registry` explicite.
  - Un garde-fou CI échoue si un `resolved` du lockfile sort de `registry.npmjs.org`, ou si une dépendance `file:` ou `link:` existe sur `main`.
  - Un jeton npmjs existe localement : ajoute une garde `prepublishOnly` qui exige `GITHUB_ACTIONS` et l'OIDC.
- **GitHub :** compte actif `PaulPerigault`, scopes `repo` et `workflow`.
- **Outils :** Node 24.21, npm 11.19, OpenTofu 1.13.1.

---

## 2. Réponses à tes questions et risques

- **Jetons GitHub IaC :** ne m'attends pas. Fais sauter explicitement le plan design-system dans `ci.yml`, avec un statut vert, tant que l'accès manque. Dans la même PR, prépare l'extension de `GITHUB_IAC_TOKEN` et `IAC_GITHUB_READONLY_TOKEN` (`infra/identity`), avec la commande exacte pour moi.
- **Première publication npm :** si npm exige que le paquet existe avant de déclarer un trusted publisher, je publierai moi-même une `0.0.0` vide par paquet. Prépare le script et la procédure dans `docs/manual-steps.md`.
- **Fusions dans `develop` :** une PR squash par lot. La traçabilité par tâche reste dans `routing-log.jsonl` et le journal.
- **Jeton Pages trop large :** applique la parade la plus restrictive possible. Si Cloudflare ne permet pas de restreindre un jeton à un seul projet Pages, consigne le risque, compare avec l'intégration Git de Pages (pas de jeton en CI) et choisis la plus sûre qui reste automatisable.
- **Flags et sandbox Kiro :** valide chaque flag en L0 (`kiro-cli chat --help`, plus un essai). Retire du dispatcher tout flag absent. Si `--sandbox` n'isole pas réellement sur macOS, n'utilise jamais `--trust-all-tools` : seulement `--trust-tools` avec une liste fermée.
- **Agents Kiro :** `.kiro/agents` doit être commité dans `develop` avant le premier worktree.

---

## 3. Modèles : autonomie totale

Tu peux utiliser **tous les modèles à ta disposition** : ceux de Kiro (`kiro-cli chat --list-models`) et toi-même, avec tes sous-agents. Seul critère : la pertinence.
- Qualité attendue pour la tâche.
- Coût.
- Diversité des éditeurs pour les revues croisées.

Le tableau §3.3 bis du kickoff n'est qu'un point de départ :
- Ajuste le routage d'après les résultats réels : escalade sur échec, désescalade après des réussites répétées.
- Bascule en `engine: claude` sur une erreur de quota ou de crédits, ou si Kiro devient inutilisable.
- Journalise chaque choix et sa raison dans `.agents/routing-log.jsonl`.

---

## 4. Identité visuelle : dans le lot, choisie par toi

- **Conservé :** uniquement le **favicon actuel**, tous ses fichiers. Ne le modifie pas et ne le régénère pas. Un test compare leurs sha256 à leur valeur actuelle.
- **À revoir entièrement :** couleurs, typographie, formes, rayons, filets, mouvement, logo hors favicon, og-cover, charte (ADR-0006, `design-charter.md`, `design-rules.mjs`) et interdits actuels, y compris celui du mono.
- **Le favicon est l'ancre.** Analyse-le d'abord (couleurs, formes, esprit), consigne ce que tu en retiens, et rends l'identité cohérente avec lui.
- **Pertinente pour moi :**
  - je suis ingénieur DevSecOps & Cloud, alternant, en école d'ingénieur ;
  - je veux tout en IaC, la sécurité et la conformité RGPD par défaut, du code senior en briques indépendantes, et des décisions écrites et prouvées ;
  - le rendu ne doit pas faire « généré par IA ».

  Appuie-toi aussi sur le contenu réel du portfolio. Pas de cliché « terminal vert sur noir ».
- **Méthode :**
  1. Trois directions au minimum : Runbook, Blueprint et Signal du rapport, ou d'autres.
  2. Une comparaison dans une ADR, au prochain numéro libre. Tu en choisis une et tu justifies.
  3. Une page de comparaison dans `apps/docs`, pour que je puisse revoir le choix plus tard.
  4. Tout passe par `packages/tokens`, pour que le choix reste réversible.
- **Non négociable :**
  - Règle de preuve du rapport : « prouvé » seulement si une source l'établit, sinon « convention » ou « préférence ».
  - Contraste WCAG 2.2 bloquant, généré depuis la matrice des rôles, dans les deux thèmes :
    - 7:1 pour le texte sur fond et sur surface ;
    - 4,5:1 pour le texte atténué, les liens et le texte sur accent ;
    - 3:1 pour les contrôles et l'anneau de focus.
  - Palette dans le gamut sRGB, testée ; contraste calculé sur la couleur sRGB rendue.
  - Tests e2e 1.4.12 (espacement du texte) et 2.5.8 (cibles), `prefers-reduced-motion` respecté.
  - Police auto-hébergée, sous une licence compatible (OFL ou équivalent), avec sous-ensemble et métriques de repli.
  - Chaque interdit « anti-IA » levé l'est par une décision écrite et motivée.
- **Ordre :** l'identité arrive en **L2, avant les composants**. Les tokens sont écrits directement en OKLCH, sans palette provisoire. Les composants à partir de L3 sont construits sur la nouvelle identité.

---

## 5. Journal permanent en Markdown (obligatoire, en continu)

Écris en continu, pas seulement à la fin :

- `docs/journal/AAAA-MM-JJ.md` : une entrée datée à chaque tâche lancée, terminée, échouée ou escaladée, à chaque décision et à chaque blocage. Chaque entrée donne :
  - l'heure, la tâche, le modèle, le résultat ;
  - les fichiers touchés ;
  - la prochaine étape.

  Jamais plus de 30 minutes sans entrée.
- `docs/lots/Lx.md` : à la fin de chaque lot :
  - ce qui a été produit ;
  - comment le vérifier, avec les commandes exactes ;
  - les écarts et ce qui reste.
- `docs/decisions-log.md` : chaque choix ouvert, avec l'alternative écartée et comment revenir en arrière.
- `docs/run-report.md` : mis à jour à chaque fin de lot.
- `docs/identity-review.md` et `docs/photos-review.md` : ce que tu as choisi à ma place, pour que je relise.
- `.agents/runs/<id>.summary.md` : écrit par le dispatcher pour chaque exécution, lisible, tiré du stream-json.

Ces fichiers sont commités avec chaque fusion de lot. Si je reviens au milieu du travail, `docs/journal/` et `docs/run-report.md` doivent suffire à comprendre où tu en es.

---

## 6. Ordre d'exécution

**A. Portfolio** (issue d'abord, puis une branche depuis `develop`) : la stack OpenTofu du §1.4 du kickoff, selon les conventions réelles relevées dans ton plan de vol.
- `infra/github/design-system.tf`, `imports.tf`, le README, les tests et scripts étendus.
- Module `ds_docs_site` + `modules/dns-cname` pour `design.paulperigault.dev`.
- Le secret Pages dans `infra/identity`.
- L'ADR, `CLAUDE.md` et `docs/infra.md` mis à jour.
- Correction de l'hygiène : topic « angular », README périmé.

Exécute fmt, validate et `npm run infra:github -- plan`, puis ouvre une PR vers `develop` avec le plan résumé en commentaire. Pas d'apply.

**B. Création du dépôt :** `gh repo create PaulPerigault/design-system --public` (licence MIT), clone dans `~/dev/design-system`, push de `develop` en premier pour en faire la branche par défaut. Copie le kickoff dans `docs/kickoff.md` (avec cet addendum) et le rapport dans `docs/research-report.md`.

**C. Lots L0 → L9 du kickoff, enchaînés sans t'arrêter :**
- L0 selon ton découpage T0.01 à T0.10 ;
- L1 : tâche pilote Stack, pour valider le dispatcher de bout en bout ;
- L2 : identité (§4 ci-dessus) puis fondations ;
- L3 à L8 selon le kickoff.

Au plus 3 tâches Kiro en parallèle. Tu es seul à fusionner dans `develop`, après revue, en commits Conventional Commits sans signature. Pour chaque choix ouvert, prends l'option la plus réversible et journalise-la.

**D. L9 :** migration du portfolio vers les paquets en dist-tag `next`, si le trusted publisher existe. Sinon, prépare une branche avec des dépendances workspace locales, jamais fusionnée, et explique-le dans le rapport. Le portfolio doit être au moins aussi bon qu'avant : e2e, axe, budgets Lighthouse, références visuelles.

**E. Fin :** `docs/run-report.md` final en PR vers `develop`, avec :
- les lots terminés ou non, et pourquoi ;
- les tâches par modèle et le taux de réussite ;
- les crédits Kiro estimés ;
- les décisions prises ;
- les PR ouvertes ;
- mes actions, avec les commandes exactes :
  - extension des jetons GitHub ;
  - `apply` OpenTofu, depuis la machine qui détient mes secrets IaC ;
  - trusted publisher npm, et la `0.0.0` si elle est nécessaire ;
  - fusions vers `main`.

---

## 7. Règles de conduite en autonomie

- Si une branche du travail est bloquée, documente le blocage dans le journal et continue sur les autres. Ne t'arrête que si plus rien n'est faisable.
- Ne jamais :
  - faire un `apply` ;
  - publier hors `--dry-run` ;
  - fusionner ou pousser vers `main` ;
  - écrire hors des dossiers autorisés ;
  - faire passer un secret par Kiro ;
  - modifier le favicon.
- Une tâche qui échoue au palier le plus haut, tu la reprends toi-même. Si tu échoues aussi, tu la consignes comme bloquée avec ton diagnostic.
- Garde le contexte léger : transmets aux exécutants l'énoncé, les fichiers autorisés, les critères et les ADR utiles, jamais l'historique.

---

## Addendum 2 (2026-10-20) : décisions de l'étape 0

Décisions du propriétaire, prises pendant l'étape 0 :

- **Garde-fous de l'assistant** : modifiables seulement sur une liste fermée de fichiers, et seulement pour les resserrer. Dans ce dépôt (L0) : `.claude/settings.json`, `tools/guards/guard-pr-merge.mjs`, `tools/guards/guard-npm-publish.mjs` et leurs tests. Toute autre modification de garde-fou demande une nouvelle autorisation.
- **Réglages versionnés** (`.claude/settings.json`) : uniquement des refus durables, sans chemin personnel. Les chemins absolus (`allow`, `additionalDirectories`, bac à sable) restent dans `.claude/settings.local.json`, ignoré par git.
- **Fusions** : toute fusion vers `main`, release-please comprise, est le geste du propriétaire. L'assistant ne fusionne que vers `develop`, une PR squash par lot.
- **`npm publish`** est refusé entièrement, `--dry-run` compris. Les paquets se vérifient avec `npm pack --dry-run` (et publint si utile).
- **Pas de branche `main`** dans ce dépôt avant l'`apply` OpenTofu du propriétaire, qui la créera avec ses rulesets (voir `docs/manual-steps.md`).
- **Bac à sable de Claude Code** : essayé le 2026-10-20 ; une écriture dans `~/Documents` a réussi malgré `sandbox.enabled` et `/sandbox`. Il est désactivé et le risque est accepté (`docs/decisions-log.md`).
- **Kiro en priorité** tant qu'il reste des crédits : implémentation, tests, docs, fragments et revues (revue `claude-opus-5.5` + revue croisée d'un autre éditeur disponible dans Kiro). Les sous-agents Claude ne servent qu'en repli. La proportion Kiro / Claude est notée à chaque fin de lot.
- **Compte Kiro** : offert par un tiers, géré par une organisation (IAM Identity Center) ; aucun secret ne transite par Kiro.

## Addendum 3 (2026-10-21) : phase 2 « Excellence » (L10 à L14)

Ordre de mission du propriétaire (`ds-brief/prompt-phase2-excellence.md`), reporté ici. Exécution
séquentielle par l'orchestrateur seul (Kiro épuisé, D-016), un relecteur par lot pour les tâches
difficiles ; mêmes garde-fous, interdits et règle de preuve « prouvé / convention / préférence ».

- **L10 — corrections et hygiène** : favicon du portfolio servi par la doc (empreintes SHA-256),
  `docs/photos-review.md`, identité git locale `PaulPerigault` (adresse noreply) et relecture du
  message de squash sur `develop` (D-004), tableaux de propriétés générés depuis les
  `interface Props`, propriétés physiques dans les classes Tailwind, mineurs de L6.
- **L11 — référentiel** (`docs/benchmark/`) : design systems publiés, grands sites (publié et
  observé, jamais mélangés), science en source primaire, normes en vigueur (WCAG 2.2, RGAA,
  EN 301 549, EAA), panel d'environ 25 acteurs, `gap.md` qui définit L12 à L14.
- **L12 — mobile d'abord, ordinateur excellent** : matrice d'appareils, cibles, formulaires,
  zones sûres, budgets de performance en échec bloquant, clavier, régression visuelle.
- **L13 — documentation** : gabarit unique de page, langage simple, recherche statique,
  déclaration d'accessibilité RGAA, procédure manuelle pour les lecteurs d'écran.
- **L14 — lisible par les IA** : `llms.txt`, Markdown par page, registre statique, paquet
  `@paulperigault/mcp` (stdio, lecture seule), ADR « MCP », gabarit `create` avec `.mcp.json`.

Toujours interdits : `apply`, publication, fusion ou push vers `main`, modification du favicon,
de `~/.npmrc` et des réglages globaux.
