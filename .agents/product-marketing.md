# Contexte marketing : design system @paulperigault

Lu par les skills `copywriting` et `copy-editing` (niveau utilisateur) et par `encre-voix`
(`.claude/skills/encre-voix/SKILL.md`). Source : entretien avec Paul du 2026-10-29 (issue #135),
pages de `apps/docs`, `AGENTS.md`, ADR-0002. `[A VERIFIER]` = information absente ou non établie :
ne pas l'écrire dans un texte publié avant confirmation de Paul.

## Produit

Design system de paulperigault.fr : tokens, CSS, composants Astro, visualisation de données,
garde-fous, CLI et serveur MCP, publiés (à terme) sous le scope `@paulperigault`. Un seul auteur,
Paul Perigault (DevOps et DevSecOps). Version `0.x`, rien n'est publié sur npmjs (README.md,
`apps/docs/src/pages/utiliser.astro`).

Il joue deux rôles : preuve de la façon de travailler de son auteur, et outil réutilisable.

## Cible, dans cet ordre

1. **Recruteurs et responsables techniques** qui jugent le travail de Paul. Ils lisent vite, ils
   cherchent un niveau d'ingénierie tenu dans la durée par une seule personne.
2. **Développeurs Astro** qui envisagent d'utiliser les paquets. Ils cherchent ce qu'ils obtiennent
   en installant, ce qui est stable et ce qui ne l'est pas.

Vocabulaire réel de ces deux publics (mots de leurs offres, de leurs tickets) : `[A VERIFIER]`,
aucun recueil n'existe. Ne pas le déduire.

## Promesse

**Principale (Paul) :** la preuve d'un niveau d'ingénierie élevé, tenu par une seule personne.
Le lecteur obtient des décisions écrites et datées, des mesures, des limites dites et une
vérification automatique de chaque règle.

**Preuve concrète (Paul) :** un outil prêt à l'emploi. Composants accessibles, CSP stricte, zéro
JavaScript par défaut.

La promesse se montre par des faits du dépôt, jamais par un adjectif.

## Problème que le texte résout

- Pour le recruteur : un portfolio affirme, il ne prouve pas. Ici chaque affirmation renvoie à un
  fichier, une norme ou une mesure.
- Pour le développeur : un kit d'interface qui ne dit ni ce qu'il garantit ni ce qu'il ne garantit
  pas. Ici les garanties sont des tests, les limites sont écrites (D-021 : « convention, pas preuve »).

## Différenciation (fondée sur des faits du dépôt)

- Règles écrites une fois (`AGENTS.md`), vérifiées en CI : fichier ≤ 120 lignes, aucune couleur brute.
- Décisions datées avec l'alternative écartée et le retour arrière (`docs/decisions-log.md`, `docs/adr/`).
- Statut des affirmations : « prouvé » seulement avec une source, sinon « convention » ou « préférence ».
- Comparaison avec des systèmes tiers nommés : `[A VERIFIER]`, jamais faite à ce jour.

## Objections probables

| Objection                                  | Réponse établie                                            | Source                                           |
| ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| « Un seul auteur : qui maintient ? »       | Règles et vérifications automatiques, décisions datées      | `AGENTS.md`, `docs/decisions-log.md`             |
| « Rien n'est publié »                      | Vrai, version `0.x` ; dit tel quel dans le README          | `README.md`, page `utiliser`                     |
| « Est-ce accessible ? »                    | Cible WCAG 2.2 AA mesurée ; AAA partiel, jamais revendiqué  | ADR-0002, page `declaration-accessibilite`       |
| « Est-ce sûr en production ? »             | CSP sans `unsafe-inline`, attribut `style` interdit         | `apps/docs/scripts/headers/policy.mjs`, AGENTS.md |

## Preuves chiffrées vérifiables

À recompter avant chaque publication : un chiffre sans date de mesure ne se cite pas.

| Fait                                         | Valeur                       | Où le vérifier                                  | Mesure       |
| -------------------------------------------- | ---------------------------- | ----------------------------------------------- | ------------ |
| Paquets npm                                  | 7 (+ `apps/docs`)            | tableau de `AGENTS.md`, `packages/`             | 2026-10-29   |
| Appareils de la matrice e2e                  | 13                           | `apps/docs/e2e/devices.ts` (`MATRIX`)           | 2026-10-29   |
| Projets de la régression Visuel              | 3                            | `VISUAL_PROJECTS`, même fichier                 | 2026-10-29   |
| Entrées du sommaire des composants           | 50 (`link(` dans `GROUPS`)   | `apps/docs/src/navigation.ts`                   | 2026-10-29   |
| Contraste texte / fond (clair, sombre)       | 16,8:1 et 15,4:1             | ADR-0002, `@paulperigault/tokens/contrast`      | 2026-10-20   |
| Contraste accent / fond (clair, sombre)      | 6,93:1 et 8,94:1             | ADR-0002 (texte), `encre-design`                | 2026-10-29   |

Mesures publiées sur `/preuves/` : `apps/docs/src/data/proofs.json`, `measuredOn` 2026-10-23 (1 331 tests
unitaires, 3 197 e2e, 31 composants, 0 violation axe). Ce fichier date d'avant les composants de
dataviz : le sommaire en compte 50. Ne citer ces valeurs qu'après régénération `[A VERIFIER]`.

Écarts constatés dans les textes actuels, à corriger dans #123 :

- L'accueil et l'architecture disent « six paquets » ; `AGENTS.md` et le README en listent sept
  (`dataviz` manque). `[A VERIFIER]` la bonne formule avec Paul.
- La page architecture dit « Captures sur 13 projets de matrice » ; la régression Visuel en compte 3
  (`VISUAL_PROJECTS`), la matrice e2e en compte 13.
- L'ADR-0002 donne 8,86 (tableau) et 8,94 (décision) pour l'accent sombre : recalculer avec
  `contrastRatio` avant de citer l'un ou l'autre.
- L'accueil écrit « design système » dans un titre et « design system » ailleurs.

## Voix

Précis, posé, sobre (les trois adjectifs d'`encre-design` : précis, posé, lisible). Une accroche
directe en tête de page, ensuite des faits. « Je » dans les textes d'auteur, neutre dans la
documentation technique. Détail et interdits : `.claude/skills/encre-voix/SKILL.md`.

Refus de Paul : tournures « faites par IA », superlatifs, mots d'agence, tout chiffre sans source,
verbes d'intention (« vise à », « permet de »).

## Textes actuels les plus proches de la voix voulue

1. `apps/docs/src/pages/auteur.astro` : dit ce qu'elle ne donne pas (« ni formation, ni employeur,
   ni date »), chaque point renvoie à un fichier, une limite est nommée (D-021). Il lui manque
   l'accroche et la première personne.
2. `apps/docs/src/pages/architecture.astro` : intro de deux phrases, tableaux sourcés par fichier.
3. `apps/docs/src/pages/index.astro` : sections claires et chiffres sourcés, mais l'ouverture
   (« Cette page résume le système… ») décrit la page au lieu d'accrocher.

## Objectifs de page

- Accueil du site : amener le recruteur à ouvrir `/preuves/` ou `/auteur/`, le développeur à ouvrir
  `/utiliser/`. `[A VERIFIER]` : l'action principale souhaitée par Paul.
- README : dire en trois lignes ce que c'est, l'état (`0.x`, non publié) et où lire les preuves.

## Learnings

Vide à la création (2026-10-29). Y noter les angles essayés et les retours de Paul.
