# Actions du propriétaire

Ce que l'assistant ne fait jamais lui-même : `apply` OpenTofu, publication npm, fusion vers `main`,
réglages de comptes et de jetons. Chaque section donne les commandes exactes. Ordre conseillé :
1 → 2 → 3 → 4 → 5.

## 1. Étendre les jetons GitHub IaC au dépôt `design-system`

Les deux jetons fine-grained de la brique `infra/github` du portfolio sont limités au dépôt
`PaulPerigault/portfolio`. GitHub n'a pas d'API pour les créer ni les modifier : action manuelle.

Sur <https://github.com/settings/personal-access-tokens>, pour chacun des deux jetons :

1. **`GITHUB_IAC_TOKEN`** (fichier de secrets local, 90 jours) : _Repository access_ → ajouter
   `PaulPerigault/design-system`. Droits inchangés (Administration, Variables, Environments,
   Secrets : _Read and write_ ; Dependabot alerts, Metadata, Pages : _Read_).
2. **`IAC_GITHUB_READONLY_TOKEN`** (secret Actions du portfolio) : _Repository access_ → ajouter
   `PaulPerigault/design-system`. Droits inchangés, tous en lecture seule. La valeur ne change pas :
   rien à reposer avec `gh secret set`.

Tant que l'étape 2 n'est pas faite, le job `tofu-plan` du portfolio saute explicitement (en vert)
le plan du dépôt `design-system`.

## 2. `apply` OpenTofu (depuis la machine qui détient les secrets IaC)

Après fusion dans `develop` de la PR « infra : dépôt design-system en IaC » du portfolio :

```shell
cd ~/dev/PaulPerigault.githun.io
git switch develop && git pull --ff-only
npm run infra:github -- init
npm run infra:github -- plan -out=github.tfplan
npm run infra:github -- apply github.tfplan
npm run infra:identity -- plan -out=identity.tfplan
npm run infra:identity -- apply identity.tfplan
npm run infra:tf -- plan -out=infra.tfplan
npm run infra:tf -- apply infra.tfplan
```

Relire chaque plan avant son `apply` : seuls des imports et des créations doivent apparaître pour
le dépôt `design-system` (aucune destruction). L'`apply` de `infra/github` crée la branche `main`
(depuis `develop`), les rulesets, l'environnement `npm-publish` et les réglages Actions ; celui de
`infra/identity` pose le secret Pages ; celui de `infra/` crée le projet Pages des docs et
l'enregistrement DNS `design.paulperigault.dev`.

## 3. Trusted publisher npm (et `0.0.0` d'amorce si nécessaire)

Le trusted publisher se déclare sur la page de réglages de chaque paquet sur npmjs.com
(<https://www.npmjs.com/package/@paulperigault/tokens/access>). Si cette page n'existe pas encore
(paquet jamais publié), publier d'abord une `0.0.0` vide, **depuis un dossier hors du dépôt** :

```shell
for name in tokens css astro guards create; do
  dir="$(mktemp -d)" && cd "$dir"
  printf '{"name":"@paulperigault/%s","version":"0.0.0","license":"MIT","description":"Réservé : publié par le workflow release de PaulPerigault/design-system."}\n' "$name" > package.json
  npm publish --access public
  cd - >/dev/null
done
```

Puis, pour chacun des 5 paquets, _Settings_ → _Trusted publishing_ → _GitHub Actions_ :

| Champ                | Valeur          |
| -------------------- | --------------- |
| Organization or user | `PaulPerigault` |
| Repository           | `design-system` |
| Workflow filename    | `release.yml`   |
| Environment name     | `npm-publish`   |

Prérequis vérifiés : npm ≥ 11.5.1, Node ≥ 22.14.0, `permissions: id-token: write` (présent dans
`.github/workflows/release.yml`). La provenance est générée automatiquement (dépôt et paquet
publics). Optionnel : _Publishing access_ → « Require two-factor authentication and disallow
tokens » une fois le premier vrai publish réussi.

## 4. Fusions vers `main`

Le dépôt n'a que `main` (D-032). Chaque fusion de PR déclenche `release.yml` (release-please), dont
la PR de release est fusionnée par le propriétaire seul.

## 5. Session Kiro

`kiro-cli login` (IAM Identity Center) est à refaire si la session expire ; l'assistant ne gère
aucun identifiant Kiro.

## 6. Vitrine : ce que Paul doit trancher ou écrire

1. **Relire et réécrire les brouillons** marqués « à relire par Paul » (`DraftNotice`) : accueil,
   auteur, utiliser, architecture, déclaration d'accessibilité. Aucun texte à la première personne
   n'est définitif. Rien n'a été inventé : employeur, formation et dates sont absents.
2. **Choisir l'hébergeur** et compléter `apps/docs/src/lib/legal.ts` (`host`, `contact`). Le build
   de production (`PP_PRODUCTION=1`) échoue tant qu'ils sont vides. Comparatif : ADR-0004. Les
   adaptateurs d'en-têtes (Cloudflare Pages, Netlify, Vercel, Nginx) sont prêts et testés.
3. **Licence des contenus et de l'identité** (le code est MIT). Proposition : CC BY 4.0 pour les
   textes et schémas (réutilisables avec mention de l'auteur) ; logo, favicon et nom **réservés**
   (tous droits réservés), car l'identité distingue l'auteur. Alternative : CC BY-NC-SA 4.0 si tu
   refuses la réutilisation commerciale ; elle gêne l'usage par des tiers. À inscrire dans
   `lib/legal.ts` (`licenseContent`) puis dans la page Mentions légales.
4. **Déclaration d'accessibilité** (`lib/a11y-statement.ts`) : date et contact à compléter. Le
   taux RGAA n'est pas mesuré ; seul un audit manuel le fournirait. Question à trancher : le site
   personnel entre-t-il dans le champ de la directive (UE) 2019/882 ou de l'art. 47 de la loi de 2005 ?
5. **Procédure VoiceOver / TalkBack** (`docs/a11y/manual-checklist.md`) : aucun résultat consigné.
6. **PWA** : essayer l'installation sur un vrai appareil (Chrome Android, Safari iOS) ; non fait.
7. **Combobox, Menu, Tabs, Tooltip** : les comportements clavier sont testés en logique pure, pas au
   clavier réel dans un navigateur ni avec un lecteur d'écran. Un passage manuel est utile.

## 7. GitHub Project « design system »

Créé : Project n° 13 (public, lié au dépôt), champs `Lot`, `Priorite`, `Taille`, `Paquet`, labels
synchronisés. L'API de `gh` ne couvre pas ce qui suit : à faire par Paul, dans cet ordre.

### 7.1 Options du champ `Status` (appel GraphQL refusé deux fois)

Le champ garde Todo, In Progress, Done. Dans le Project : menu du champ `Status` → _Edit_ (ou
_Settings_ → _Status_), remplacer les options par celles-ci (nom, couleur, description) :

| Nom      | Couleur | Description                         |
| -------- | ------- | ----------------------------------- |
| A trier  | gris    | Nouvelle, pas encore qualifiée      |
| Pret     | bleu    | Qualifiée, prête à être prise       |
| En cours | jaune   | Branche et PR ouvertes              |
| En revue | orange  | PR en attente de CI ou de relecture |
| Fait     | vert    | Fusionnée, issue fermée             |

Apport : un état par carte, commun aux vues et aux workflows ci-dessous.

### 7.2 Milestones (appel `gh api` refusé deux fois)

Soit à la main (Issues → Milestones → _New milestone_, titre et description, sans date), soit en
lançant ces commandes toi-même :

```shell
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M-histoire" -f description="Lots L0 à L20, livrés avant le processus : issues de rattrapage fermées."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M0 fondations" -f description="Processus : GitHub Project, labels, bascule vers main, modèles d'issue et de PR."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M1 TypeScript strict" -f description="Migration des paquets et outils vers TypeScript strict (ADR-0005), tsc vers dist/."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M2 publication npm 0.x" -f description="Première publication des paquets sur npm, dist-tags next et latest."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M3 migration du portfolio (L9)" -f description="Le portfolio consomme les paquets publiés (lot L9)."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M4 Rust pp-color (conditionnel)" -f description="Crate pp-color (OKLCH, sRGB, gamut, contraste) et paquet WebAssembly, selon D-030."
gh api -X POST repos/PaulPerigault/design-system/milestones -f title="M5 1.0" -f description="Version 1.0 : API publique stabilisée."
gh api -X PATCH repos/PaulPerigault/design-system/milestones/1 -f state=closed
```

Le dernier appel ferme `M-histoire` (numéro 1 si le dépôt n'a jamais eu de milestone). Apport : la
feuille de route par échéance, et les lots passés rangés hors du travail courant.

### 7.3 Vues

Dans le Project : _+ New view_, puis _Save changes_ pour chacune.

| Vue              | Disposition | Filtre                   | Regroupement      | Tri / champs                |
| ---------------- | ----------- | ------------------------ | ----------------- | --------------------------- |
| Tableau          | Board       | `-status:Fait`           | colonnes `Status` | `Priorite` croissant        |
| Feuille de route | Roadmap     | aucun                    | `Milestone`       | marqueurs : `Milestone`     |
| A valider        | Table       | `label:"etat:a-valider"` | `Paquet`          | `Priorite`, `Taille`, `Lot` |

Apport : le tableau montre le travail en cours ; la feuille de route, l'avancement par milestone ;
« A valider » liste ce qui attend Paul.

### 7.4 Workflows (_Settings_ → _Workflows_ du Project)

- **Item added to project** : activer, `Status` = `A trier`. Toute issue ou PR ajoutée arrive à trier.
- **Auto-add to project** : activer, dépôt `PaulPerigault/design-system`, filtre `is:issue,pr is:open`.
  Apport : plus d'ajout manuel des issues et PR.
- **Pull request merged** : activer, `Status` = `Fait`.
- **Item closed** : activer, `Status` = `Fait`.
- **Item reopened** : activer, `Status` = `En cours`.
- **Auto-archive items** : activer, filtre `is:closed updated:<@today-14d`. Apport : le tableau reste
  lisible.

## 8. Bascule vers `main` (F2a-2)

État : `develop` renommée en `main` par Paul (2026-10-28), branche par défaut `main`, PR #37 fusionnée.

Ruleset et options du dépôt : les appels `gh api` ont été refusés par les permissions de l'agent (une
tentative chacun, sans contournement). Le ruleset est versionné dans `.github/rulesets/main.json` : PR
obligatoire, 0 approbation, check `ci` requis, historique linéaire, squash seul, force-push et
suppression interdits, aucune exemption (Paul passe par les PR comme tout le monde ; en cas de CI
cassée, il édite le ruleset dans _Settings_ → _Rules_). À lancer en PowerShell, depuis la racine du
dépôt :

```powershell
gh api repos/PaulPerigault/design-system/rulesets --method POST --input .github/rulesets/main.json
gh api repos/PaulPerigault/design-system --method PATCH `
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false `
  -F delete_branch_on_merge=true -F allow_auto_merge=true
git push --dry-run origin HEAD:main   # doit être refusé (PR obligatoire)
```

Autre réglage manquant : `release.yml` échoue sur `main` (« GitHub Actions is not permitted to create
or approve pull requests »). _Settings_ → _Actions_ → _General_ → _Workflow permissions_ : cocher
_Allow GitHub Actions to create and approve pull requests_ (ou le faire porter par l'`apply`
OpenTofu, §2).

## 9. Issues de rattrapage (F2b-2a)

Les appels `gh` d'écriture ont été refusés à l'agent : le script est dans `tmp/` (hors dépôt,
`tmp/` est exclu par `.git/info/exclude`). À lancer par Paul :

```powershell
powershell -ExecutionPolicy Bypass -File tmp/create-catchup-issues.ps1
```

Le script est idempotent (une issue dont le titre existe n'est pas recréée). Il crée 24 issues
(21 lots, 3 « divers ») plus la parente `[Historique] Lots L0 à L20`, les ajoute au Project 13 avec
les champs `Lot` et `Paquet`, ferme les lots livrés (L9 reste ouverte) et relie les sous-issues si
l'API l'accepte. Les champs `Taille` et `Priorite` ne sont pas posés : les labels `taille:` portent
la taille. Ensuite, nettoyage : `Remove-Item -Recurse tmp/catchup, tmp/create-catchup-issues.ps1, tmp/gen-catchup.mjs`.
Reporter les numéros d'issue dans `docs/history/catch-up.md` n'est pas nécessaire : la parente les liste.

## 10. Issues du reste du chantier (F2b-2b)

Les appels `gh` d'écriture ont de nouveau été refusés à l'agent. Le script est dans `tmp/` (hors dépôt).
À lancer par Paul, depuis la racine du dépôt :

```powershell
powershell -ExecutionPolicy Bypass -File tmp/create-roadmap-issues.ps1 -DryRun   # affiche sans écrire
powershell -ExecutionPolicy Bypass -File tmp/create-roadmap-issues.ps1
```

Il crée 47 issues (9 rattrapages et leur parente fermés, les étapes à venir, six épiques, neuf
tâches `[Paul]`), pose labels, assignee, milestone, Project 13 (`Status`, `Lot`, `Paquet`, `Taille`,
`Priorite`), dépendances et sous-issues, relie #51 à M3, puis affiche la correspondance clé → numéro.
Idempotent : une issue dont le titre existe est reprise. Correspondance : `docs/history/roadmap-issues.md`.

À ajouter à la main dans le Project (champ `Lot`, options absentes ; le script les signale) : `R`
(Rust), `V` (visualisation), `S` (sobriété). Labels `pkg:color` et `pkg:data` : absents de
`.github/labels.json`, donc à ajouter au fichier puis à synchroniser (`node tools/github/sync-labels.mjs`).
Ensuite : `Remove-Item -Recurse tmp/roadmap, tmp/create-roadmap-issues.ps1, tmp/gen-roadmap.mjs`.

## 11. F2a-3 : previews Cloudflare par PR et jeton de release-please

Issue de l'étape : #79. Les étapes A et B relèvent de #105 (jetons IaC) et #106 (`apply` OpenTofu) ;
décisions D-036, `docs/process/previews.md`, `docs/process/release-token.md`. Faire A à F dans l'ordre.

### A. Autoriser l'application GitHub de Cloudflare sur le dépôt (aucune API ne le fait)

1. <https://dash.cloudflare.com> → Workers & Pages → Create → Pages → Connect to Git.
2. Autoriser « Cloudflare Workers & Pages » sur GitHub, dépôts : _Only select repositories_ →
   `PaulPerigault/design-system`. Quitter l'assistant sans créer de projet (OpenTofu le crée).

À voir : <https://github.com/settings/installations> liste l'application avec ce seul dépôt.

### B. Brique IaC du projet Pages (dépôt portfolio, que cette étape ne modifie pas)

Le jeton Cloudflare de l'IaC doit avoir le droit _Cloudflare Pages : Edit_ (voir #105). Afficher le
projet Pages déjà déclaré pour les docs et la version du fournisseur :

```powershell
cd ~/dev/PaulPerigault.githun.io
git switch develop; git pull --ff-only
Select-String -Path infra/*.tf -Pattern 'cloudflare_pages_project' -Context 0,12
npm run infra:tf -- providers
```

Dans le bloc `cloudflare_pages_project` trouvé, aligner ces réglages (syntaxe attributs du
fournisseur `cloudflare` v5 ; en v4 ce sont des blocs `source {}`, `build_config {}`) :

```hcl
  production_branch = "main"
  source = {
    type = "github"
    config = {
      owner                         = "PaulPerigault"
      repo_name                     = "design-system"
      production_branch             = "main"
      production_deployments_enabled = true
      preview_deployment_setting    = "all"
      preview_branch_includes       = ["*"]
      pr_comments_enabled           = true
    }
  }
  build_config = {
    build_command   = "npm ci && npm -w @paulperigault/docs run build"
    destination_dir = "apps/docs/dist"
    root_dir        = "/"
  }
  deployment_configs = {
    preview    = { env_vars = { NODE_VERSION = { type = "plain_text", value = "24" } } }
    production = { env_vars = { NODE_VERSION = { type = "plain_text", value = "24" } } }
  }
```

Puis, brique par brique, en lisant le plan avant l'`apply` :

```powershell
npm run infra:tf -- plan -out=pages.tfplan
```

À voir : `Plan: 0 to add, 1 to change, 0 to destroy` (ou `1 to add` si le projet n'existe pas), seul
`cloudflare_pages_project` modifié, aucune destruction. Sinon, s'arrêter. Si le plan est conforme :

```powershell
npm run infra:tf -- apply pages.tfplan
```

À voir : `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.` (ou `0 added, 1 changed`),
puis dans le tableau de bord, projet des docs → Settings → Builds : source `PaulPerigault/design-system`,
branche de production `main`.

### C. Jeton de release-please (voir `docs/process/release-token.md`)

1. <https://github.com/settings/personal-access-tokens/new> : nom `RELEASE_PLEASE_TOKEN`, expiration
   90 jours, _Only select repositories_ → `design-system`, droits _Contents_ et _Pull requests_ en
   _Read and write_ (_Metadata_ lecture seule est ajouté d'office). Copier le jeton.
2. Le poser en secret, sans trace : `Read-Host -AsSecureString` ne l'affiche pas, la conversion en
   texte n'existe qu'en mémoire, `gh` le reçoit par l'entrée standard (ni fichier, ni argument, ni historique).

```powershell
$secure = Read-Host 'Jeton RELEASE_PLEASE_TOKEN' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) |
    gh secret set RELEASE_PLEASE_TOKEN --repo PaulPerigault/design-system
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
gh secret list --repo PaulPerigault/design-system
```

À voir : `✓ Set Actions secret RELEASE_PLEASE_TOKEN for PaulPerigault/design-system`, puis la liste
avec `RELEASE_PLEASE_TOKEN`. Ajouter à ton agenda la rotation à 90 jours.

### D. Fusion de la PR F2a-3, puis release-please

Après la fusion, le workflow `Release` s'exécute sur `main`. À voir :

```powershell
gh run list --repo PaulPerigault/design-system --workflow release.yml --limit 1
gh pr list --repo PaulPerigault/design-system --state open --search 'chore: release in:title'
```

Le run est `completed success` ; s'il existe un changement publiable, la PR « chore: release … »
apparaît. Vérifier que `ci` tourne dessus :

```powershell
$n = gh pr list --repo PaulPerigault/design-system --search 'chore: release in:title' --json number --jq '.[0].number'
gh pr checks $n --repo PaulPerigault/design-system
```

À voir : une ligne `ci` en `pending` puis `pass` (avant ce changement, aucune ligne `ci`).

### E. Première preview, sur une PR de test

```powershell
cd D:\design-system
git switch main; git pull --ff-only
git switch -c processus/test-preview
git commit --allow-empty -m "chore: test de preview"
git push -u origin processus/test-preview
gh pr create --repo PaulPerigault/design-system --base main --title "chore: test de preview" --body "Test de preview, a fermer."
gh pr checks --repo PaulPerigault/design-system
```

À voir : une ligne « Cloudflare Pages » (statut `pass`, lien « Details » vers l'URL
`https://<hash>.<projet>.pages.dev`). Vérifier les en-têtes (remplacer l'URL par celle du lien) :

```powershell
curl.exe -sI https://<url du lien Details> | Select-String 'x-robots-tag|content-security-policy|strict-transport'
```

À voir : `x-robots-tag: noindex`, la CSP et HSTS. Fermer sans fusionner :
`gh pr close --delete-branch --repo PaulPerigault/design-system processus/test-preview`.

### F. Clôture

`gh issue close 79 --repo PaulPerigault/design-system` si la PR F2a-3 n'a pas fermé l'issue ; cocher
#105 et #106 pour ce qui concerne ces briques.

## 12. V2-0 : paquet dataviz, ce qui reste à Paul

Issues #120 (V2-0) et #121 (branchement des variables d'entrée). Rien d'autre n'a été refusé que
les appels ci-dessous (écriture refusée à l'agent) ; à lancer depuis la racine du dépôt :

```powershell
gh api -X POST repos/PaulPerigault/design-system/labels -f name=pkg:dataviz -f color=3d4f63 -f "description=Paquet @paulperigault/dataviz (contrat de données, palettes)"
gh issue edit 120 --add-label pkg:dataviz
$sub = gh api repos/PaulPerigault/design-system/issues/120 --jq .id
gh api -X POST repos/PaulPerigault/design-system/issues/101/sub_issues -F sub_issue_id=$sub
$blocker = gh api repos/PaulPerigault/design-system/issues/120 --jq .id
gh api -X POST repos/PaulPerigault/design-system/issues/94/dependencies/blocked_by -F issue_id=$blocker
$blocker = gh api repos/PaulPerigault/design-system/issues/120 --jq .id
gh api -X POST repos/PaulPerigault/design-system/issues/121/dependencies/blocked_by -F issue_id=$blocker
```

Le script `sync-labels.mjs --apply` n'a pas été lancé : il supprimerait aussi `autorelease: pending`
(label de release-please, absent de `labels.json`). À décider : l'ajouter au fichier, ou garder la
création de label à la main pour ce cas.

Project 13 : le champ `Paquet` n'a pas l'option `dataviz` (ajouter l'option dans _Settings_ → champ
`Paquet`, puis la poser sur #120). `Status` de #94 : passer à `Pret` une fois #120 fusionnée.
