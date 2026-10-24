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

Le dépôt n'a que `develop` jusqu'à l'étape 2. Ensuite, une PR `develop → main` par release, que
l'assistant prépare (CI verte) et que le propriétaire fusionne. La fusion déclenche
`release.yml` (release-please), dont la PR de release se fusionne aussi à la main.

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
