# ADR-0001 — Dépôt dédié, paquets npm et exécution déléguée

- Statut : accepté
- Date : 2026-10-20
- Contexte de référence : `docs/kickoff.md` (kickoff + addenda), `docs/research-report.md`

## Contexte

Le design system de paulperigault.fr devait d'abord vivre dans un dossier du portfolio, calqué
sur `worker/` (rapport §4). Le kickoff en fait un vrai produit : réutilisable par d'autres sites,
y compris non Astro, versionné et publié.

## Décision

1. **Dépôt dédié** `PaulPerigault/design-system`, monorepo npm workspaces, cinq paquets publiés
   sous `@paulperigault` (`tokens`, `css`, `astro`, `guards`, `create`) et une app `apps/docs`.
   Dépendances à sens unique : `tokens ← css ← astro` ; `guards` et `create` sans dépendance
   d'exécution vers les autres.
2. **Consommation par import** du paquet (semver) ; `eject` reste l'exception (copie verrouillée
   par `pp-ds.lock.json`). `registry.json` au schéma shadcn sert de métadonnées.
3. **Registre npmjs public**, publication uniquement par le workflow `release` (trusted
   publishing OIDC, provenance automatique), jamais depuis un poste (`prepublishOnly`).
4. **Infrastructure du dépôt en IaC** dans la brique `infra/github` du portfolio (dépôt adopté
   par blocs `import`), Pages et DNS des docs dans `infra/` ; l'`apply` reste au propriétaire.
5. **Exécution déléguée** : un dispatcher Node testé (`tools/agents/`) lance chaque tâche
   atomique dans un worktree isolé, par Kiro en headless (session `kiro-cli login`, aucun
   secret), contrôle l'acceptation et la propriété des fichiers, et journalise le routage.

## Conséquences

- Le portfolio consommera des versions publiées (dist-tag `next` pour les préversions) ; un
  garde-fou refuse toute dépendance `file:`/`link:` sur `main`.
- La couleur (`color`, `contrast`) vit dans `tokens` (D-001), parce que le générateur en a besoin.
- Le contrôle de propriété est la garantie finale : `--sandbox` n'existe pas dans kiro-cli 2.32
  et le bac à sable de Claude Code n'a pas fonctionné sur ce poste (D-002, D-005).

## Alternatives écartées

- Dossier `design-system/` dans le portfolio (rapport) : pas de réutilisation hors du site.
- GitHub Packages : son registre npm exige un jeton même pour installer un paquet public, ce qui
  casse `npx @paulperigault/create`.
