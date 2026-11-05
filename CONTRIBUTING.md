# Contribuer

Une contribution suit la chaîne issue, branche, commits, PR. La CI vérifie les messages de commit
et les règles de code ; le reste se relit dans la PR.
Ce fichier dit par où commencer ; les règles qui font foi sont dans [AGENTS.md](AGENTS.md) et
[docs/process/gouvernance.md](docs/process/gouvernance.md), et ne sont pas recopiées ici.

Le projet a un seul propriétaire, Paul Perigault, qui trie les issues et fusionne les PR. Toute
participation suit le [code de conduite](CODE_OF_CONDUCT.md).

## Ouvrir une issue

- Choisir un formulaire dans `.github/ISSUE_TEMPLATE/` : les issues vierges sont refusées
  (`config.yml`). Le rôle de chaque formulaire : [docs/process/templates.md](docs/process/templates.md).
- Une faille de sécurité ne se signale jamais dans une issue : suivre [SECURITY.md](SECURITY.md).
- L'issue passe à « Pret » quand elle remplit la définition de prêt de
  [gouvernance.md](docs/process/gouvernance.md#définition-de-prêt) : jalon, priorité et dates sont
  posés par le propriétaire.

## Préparer le poste

Node 24 (`.nvmrc`) et npm 11. Rust n'est nécessaire que pour `crates/` et les paquets `color` et
`data` (version dans `rust-toolchain.toml`).

```bash
npm ci
npm run verify
```

`npm ci` installe aussi les hooks Git (Husky) : `commit-msg` lance commitlint, `pre-commit` lance
lint-staged. Ne jamais les contourner (`--no-verify`, `HUSKY=0`).

## Écrire le changement

- Branche `<type>/<n>-<sujet>`, où `<type>` est un type Conventional Commits et `<n>` le numéro de
  l'issue ([règle de traçabilité](docs/process/gouvernance.md#règle-de-traçabilité)).
- Règles de code, limites vérifiées en CI et sens des dépendances entre paquets :
  [AGENTS.md](AGENTS.md). Un fichier trop long se découpe : la limite ne se relève pas.
- Commits en Conventional Commits, sujet en minuscules de 72 caractères au plus, sans signature
  d'outil (`commitlint.config.mjs`).
- Un choix durable (structure, dépendance) passe par une ADR dans [docs/adr/](docs/adr/).

## Ouvrir la PR

- Remplir [le gabarit de PR](.github/PULL_REQUEST_TEMPLATE.md) : `Closes #n` en première ligne de
  « Issue liée », ou `Refs #n` si d'autres PR suivent.
- Titre de 72 caractères au plus avec le suffixe `(#n)`, corps de 90 colonnes au plus par ligne :
  ils deviennent le message du commit de fusion.
- Le ruleset de `main` exige une PR, la fusion en squash, un historique linéaire et le contrôle `ci`
  vert (`.github/rulesets/main.json`). Le propriétaire relit et fusionne.

## Licence des contributions

Le code des paquets est publié sous licence MIT ([LICENSE](LICENSE)). Selon les conditions
d'utilisation de GitHub (section D.6), une contribution déposée dans ce dépôt est fournie sous la
même licence.
