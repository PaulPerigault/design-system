# Essais de la voix Encre (#135)

Deux textes réels passés au skill `encre-voix` (`.claude/skills/encre-voix/SKILL.md`), le 2026-10-29.
Propositions seulement : **aucune page de `apps/docs` ni le README n'est modifié** par cette étape.
La refonte du site est l'issue #123 ; les textes au « je » y gardent `DraftNotice` (Paul relit, #112).

## Essai 1 : page d'accueil (`apps/docs/src/pages/index.astro`)

Diagnostic : **B** (voix réelle présente : factuelle, sourcée). Lecteur 1 (recruteur). Type : texte
d'auteur, donc « je ».

### Avant (extraits)

> Cette page résume le système, ses décisions et ses preuves. Chaque affirmation renvoie à une source du dépôt.
>
> **Ce que c’est** : C’est le design system de paulperigault.fr, conçu pour des sites d’un seul auteur et écrit en Astro. Il comprend six paquets : tokens, css, astro, guards, create et mcp.
>
> **Comment il travaille** : […] L’accessibilité vise WCAG 2.2 AA et se mesure. […]
>
> **Ce que le design système prouve** : […]
>
> **Qui** : Paul Perigault travaille en DevOps et DevSecOps. Son site et la page auteur donnent le détail.

### Après

> Je développe seul le design system de paulperigault.fr. Ses règles de taille, de couleur et de style
> sont écrites une fois et vérifiées en CI ; chaque décision est datée dans le dépôt.
>
> **Ce que c’est** : sept paquets npm pour des sites d’un seul auteur, écrits en Astro : tokens, css,
> dataviz, astro, guards, create et mcp (tableau d’`AGENTS.md`). Rien n’est publié : les versions
> sont en `0.x` (`README.md`).
>
> **Comment il travaille** : […] L’accessibilité cible WCAG 2.2 AA et se mesure avec axe :
> 0 violation à la mesure du 2026-10-23 (`apps/docs/src/data/proofs.json`) `[A VERIFIER : à régénérer]`. […]
>
> **Ce que le dépôt établit** : […]
>
> **Qui** : je travaille en DevOps et DevSecOps. Mon site et la page auteur donnent le détail.

### Justification

| Changement                                                                                                                                                      | Règle de `encre-voix`                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| L'ouverture « Cette page résume… » décrit la page : remplacée par une accroche qui donne un fait (seul, règles vérifiées, décisions datées).                    | Accroche directe en tête (Paul) ; « Cette page résume » proscrite.    |
| « Chaque affirmation renvoie à une source » retiré de l'ouverture : la phrase est vraie mais l'accroche porte déjà la preuve, et le reste de la page le montre. | Épreuve de non-modification : une phrase, une idée.                   |
| « C’est le design system… conçu pour… » : phrase coupée, sujet concret (« sept paquets… »).                                                                     | Phrases courtes ; verbe concret.                                      |
| « six paquets » → « sept », `dataviz` ajouté. `AGENTS.md` et le README en listent sept.                                                                         | Preuves : chiffre sourcé ; écart à confirmer par Paul `[A VERIFIER]`. |
| Ajout de « Rien n’est publié… `0.x` » : le lecteur 2 doit connaître l'état avant de chercher une commande.                                                      | Dire les limites au même niveau que les forces.                       |
| « vise WCAG 2.2 AA » → « cible WCAG 2.2 AA » + mesure datée. « vise » est un verbe d'intention.                                                                 | Verbes d'intention ; tout chiffre porte sa source.                    |
| « Ce que le design système prouve » → « Ce que le dépôt établit » ; « design système » corrigé.                                                                 | « Prouvé » seulement avec une source ; orthographe « design system ». |
| « Paul Perigault travaille… Son site » → « je travaille… Mon site ».                                                                                            | Personne : texte d'auteur au « je », `DraftNotice` conservé.          |
| Liste des quatre faits (composants, appareils, CSP, zéro JS) : **inchangée**, déjà sourcée.                                                                     | Épreuve de non-modification.                                          |

À vérifier : le nombre de paquets avec Paul ; régénérer `proofs.json` (sa mesure date du 2026-10-23, avant
les composants de visualisation) ; action principale de l'accueil (voir `.agents/product-marketing.md`).

## Essai 2 : README racine (`README.md`)

Diagnostic : **B**. Lecteur 2 d'abord (développeur qui arrive sur le dépôt), lecteur 1 ensuite. Type :
texte d'auteur (README) : « je » seulement dans l'intro, la suite reste neutre.

### Avant

> Design system de paulperigault.fr : tokens, CSS, composants Astro accessibles, garde-fous de conception et CLI, publiés sur npmjs sous le scope `@paulperigault`.
>
> […] ## Statut : En construction : versions `0.x`, rien n'est encore publié. […]

### Après

> Je tiens seul le design system de paulperigault.fr : sept paquets npm sous le scope `@paulperigault`
> (tokens, CSS, données, composants Astro, garde-fous, CLI, serveur MCP). Rien n'est publié à ce jour :
> versions `0.x`.
>
> Les règles sont dans [AGENTS.md](AGENTS.md), les décisions dans
> [docs/decisions-log.md](docs/decisions-log.md), les mesures sur la page preuves de la documentation.

Le tableau des paquets, « Développement », « Sécurité » et « Licence » restent tels quels.

### Justification

| Changement                                                                                                                                               | Règle de `encre-voix`                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| La première phrase dit « publiés sur npmjs » alors que « Statut » dit « rien n'est encore publié » : contradiction retirée, l'état est dit dès l'intro.  | Preuves : un fait ne se contredit pas ; limites dites au même niveau que les forces.         |
| « composants Astro **accessibles** » : adjectif sans mesure, retiré de l'intro. L'accessibilité est un fait chiffré ailleurs (WCAG 2.2 AA, `/preuves/`). | Superlatifs et adjectifs de vente ; épreuve des trois questions (question 2 : vérifiable ?). |
| « Je tiens seul » ajouté : c'est le fait qui porte la promesse (lecteur 1).                                                                              | Promesse : niveau d'ingénierie tenu par une seule personne.                                  |
| Liste de paquets mise en parenthèse, tableau conservé plus bas.                                                                                          | Une idée par phrase ; épreuve de non-modification.                                           |
| Ajout du renvoi vers les règles, décisions et mesures.                                                                                                   | Accroche qui dit où est la preuve.                                                           |
| « garde-fous de conception » retiré de l'intro, repris dans le tableau.                                                                                  | Pas de répétition ; le tableau dit déjà « contrôles de conception ».                         |

À vérifier : « sept » (voir essai 1) ; ajouter ou non un lien direct vers la page preuves une fois le
site publié `[A VERIFIER]`.
