# Registre des skills tiers

Issue : [#222](https://github.com/PaulPerigault/design-system/issues/222). Règle : `encre-securite`, section « Skills tiers : provenance » (D-116). Rapport détaillé de la première veille : [veille-skills-2026-11.md](veille-skills-2026-11.md). Un candidat entre dans ce registre dès qu'il est vu, avec son verdict, même refusé : on ne le réévalue pas sans raison.

Étoiles, dernière activité et licence : API publique GitHub, mesure du 2026-11-02, sans valeur de preuve. « Non lu » : aucun fichier du dépôt n'a été ouvert ; le verdict n'est alors qu'une présomption et porte `[À VÉRIFIER]`.

## Suivi amont (lu par `tools/skills/check-upstream.mjs`)

Une ligne par couple (skill installé, dépôt source) : SHA complet lu à la réécriture. Le contrôle mensuel compare ce SHA à celui du dépôt amont et affiche les écarts, sans rien modifier. Ne pas changer le format des colonnes.

| Skill              | Dépôt                                | SHA relu                                   |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| encre-cas-limites  | emilkowalski/skills                  | `f1090bec277140d02ed202440185ad9d02ac1490` |
| encre-cas-limites  | nextlevelbuilder/ui-ux-pro-max-skill | `3a13158ff1f32156cbe144108de48eda2ecaed9a` |
| encre-mobile-natif | emilkowalski/skills                  | `f1090bec277140d02ed202440185ad9d02ac1490` |
| encre-rendu-ia     | pbakaus/impeccable                   | `e89e3ada3e875a89ac2c5d33d11e65ebef6fe285` |
| encre-architecture | softaworks/agent-toolkit             | `3027f20f3181758385a1bb8c022d4041dfb4de84` |

## Candidats vus

Verdicts : **retenu** (réécrit au format `encre-*`), **proposé** (retenu en principe, en attente d'un emplacement ou d'une décision), **refusé**, **non lu**.

| Dépôt                                 | SHA relu   | Licence                   | Étoiles | Dernier push | Verdict | Raison                                                                                                                                                                   |
| ------------------------------------- | ---------- | ------------------------- | ------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| emilkowalski/skills                   | `f1090bec` | MIT                       | 52 922  | 2026-11-02   | retenu  | `break-ui` et `mobile-native` : `encre-cas-limites`, `encre-mobile-natif` ; animation refusée                                                                            |
| pbakaus/impeccable                    | `e89e3ada` | Apache-2.0                | 100 124 | 2026-11-02   | retenu  | méthode seule : `encre-rendu-ia` ; skill et détecteur refusés (hook, télémétrie, binaire)                                                                                |
| nextlevelbuilder/ui-ux-pro-max-skill  | `3a13158f` | MIT                       | 144 136 | 2026-11-01   | retenu  | règles et liste avant livraison dans `encre-cas-limites` ; catalogue de styles et installeur refusés                                                                     |
| obra/superpowers                      | `2ce8aa15` | MIT                       | 311 024 | 2026-10-29   | refusé  | hook de session, flux obligatoire ; doublon du plugin utilisateur                                                                                                        |
| rebelytics/one-skill-to-rule-them-all | `ba696b2c` | CC BY 4.0                 | 3 692   | 2026-10-28   | retenu  | méthode d'observation des corrections : `encre-veille` ; scripts et dossier d'observations refusés                                                                       |
| nathankim0/clean-architecture-skills  | `e27a49df` | MIT sans titulaire        | 108     | 2026-10-23   | refusé  | licence ambiguë (copyright sans titulaire)                                                                                                                               |
| softaworks/agent-toolkit              | `3027f20f` | MIT                       | 2 615   | 2026-03-05   | retenu  | grille C4 seule : `encre-architecture` ; scripts shell de `qa-test-planner` refusés                                                                                      |
| travisvn/awesome-claude-skills        | `1da55aa8` | aucune                    | 15 675  | 2026-04-28   | refusé  | annuaire sans licence ; piste de recherche seulement                                                                                                                     |
| addyosmani/web-quality-skills         | `afa8da94` | MIT (Addy Osmani)         | 3 026   | 2026-08-24   | proposé | `accessibility` (464 lignes) et `seo` (409) lus : aucun hook ; un script shell en lecture seule (`web-quality-audit`) refusé ; mention de `npx lighthouse` à neutraliser |
| Community-Access/accessibility-agents | `7597f1a2` | MIT                       | 431     | 2026-10-30   | refusé  | hooks (`hooks/guard.mjs`, manifestes par client) et dizaines d'agents                                                                                                    |
| cloudflare/skills                     | `1a330488` | Apache-2.0                | 3 253   | 2026-11-02   | refusé  | centré sur Workers, Durable Objects, agents ; scripts shell dans `turnstile-spin` ; rien pour Pages statique                                                             |
| trailofbits/skills                    | non lu     | CC BY-SA 4.0              | 7 952   | 2026-10-28   | refusé  | licence avec partage dans les mêmes conditions : incompatible avec une copie sous MIT sans décision ; `[À VÉRIFIER]`                                                     |
| anthropics/skills                     | non lu     | aucune au niveau du dépôt | 186 637 | 2026-10-28   | non lu  | licence par skill : à lire skill par skill avant tout verdict ; `[À VÉRIFIER]`                                                                                           |
| vercel-labs/agent-skills              | non lu     | aucune                    | 33 403  | 2026-10-28   | refusé  | licence absente (champ nul) ; `[À VÉRIFIER]`                                                                                                                             |
| openai/skills                         | non lu     | aucune                    | 28 464  | 2026-10-28   | refusé  | licence absente (champ nul) ; `[À VÉRIFIER]`                                                                                                                             |
| microsoft/playwright-cli              | non lu     | Apache-2.0                | 14 873  | 2026-11-01   | non lu  | produit en ligne de commande, non un skill ; le dépôt a déjà Playwright (`apps/docs/e2e/`) ; `[À VÉRIFIER]`                                                              |

## Première veille par thème (2026-11-02)

Recherche par l'API GitHub et par noms de dépôts officiels connus ; la recherche par sujet a été refusée par l'environnement, donc la liste est partielle. Un thème sans candidat lu n'est pas « vide » : il est marqué non évalué.

| Thème                           | Candidats vus                                                          | Verdict                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Accessibilité                   | addyosmani/web-quality-skills (`accessibility`) ; accessibility-agents | proposé : le premier, MIT, comble un manque réel ; le second refusé (hooks). ⚖️ plafond      |
| SEO technique                   | addyosmani/web-quality-skills (`seo`)                                  | proposé, deuxième priorité ; le dépôt contrôle déjà la longueur des descriptions. ⚖️ plafond |
| Performance web                 | addyosmani/web-quality-skills (`performance`, `core-web-vitals`)       | non retenu : double `encre-greenops` et le skill utilisateur `web-perf`                      |
| Éco-conception                  | aucun lu                                                               | `encre-greenops` couvre le thème ; pas de candidat                                           |
| Cloudflare Pages                | cloudflare/skills                                                      | refusé (Workers, scripts) ; `encre-greenops` et ADR-0004 couvrent l'hébergement              |
| Tests                           | microsoft/playwright-cli (non lu)                                      | non évalué `[À VÉRIFIER]`                                                                    |
| Sécurité applicative            | trailofbits/skills (non lu)                                            | refusé (CC BY-SA) ; plugins utilisateur déjà présents ; `encre-securite` couvre le dépôt     |
| Rust et WebAssembly             | aucun lu                                                               | non évalué ; `encre-rust` couvre le dépôt                                                    |
| Astro                           | aucun lu                                                               | non évalué `[À VÉRIFIER]`                                                                    |
| Rédaction française, UX writing | aucun lu                                                               | non évalué ; `encre-voix` couvre le dépôt                                                    |

## Proposition de la première veille

Au plafond de 12 skills (11 installés, `encre-veille` prendra le douzième), `accessibilité` et `SEO technique` n'entrent que si un skill sort ou si leur apport est supérieur. Recommandation : accessibilité d'abord (aucun skill ne la porte), en remplacement d'`encre-architecture` dont le fond est dans ADR-0006 ; SEO ensuite, à décider. Décision de Paul : `tmp/questions-paul.md`, point 2.
