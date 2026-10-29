# ADR-0008 — Refonte du site de documentation : parcours, navigation, voix

- Statut : proposé (2026-10-29), choisi par l'orchestrateur en l'absence du propriétaire ; relecture
  demandée à Paul. Documentation seulement : aucune page n'est modifiée par cet ADR.
- Lié : ADR-0002 (identité Encre), ADR-0007 (données), issue #123 (cahier), #164 (audit et ADR),
  `docs/design/audit-site.md`, `.claude/skills/encre-voix/SKILL.md`, `.agents/product-marketing.md`.

## Contexte

L'audit du 2026-10-29 (`docs/design/audit-site.md`) relève : un accueil sans démonstration, qui
décrit la page au lieu de dire ce que le lecteur obtient ; une navigation à quatre liens qui cache
Utiliser, Preuves, Architecture et Auteur ; une installation introuvable depuis l'accueil (et pour
cause, rien n'est publié) ; des textes incohérents d'une page à l'autre ; des preuves périmées ; la
visualisation de données noyée dans un sommaire de 50 composants.

Deux lecteurs, dans cet ordre (`.agents/product-marketing.md`) : le recruteur ou responsable
technique, qui juge un niveau d'ingénierie tenu par une seule personne ; le développeur Astro, qui
veut savoir ce qu'il obtient en installant et ce qui est stable.

## Décision 1 : l'accueil prouve avant d'expliquer

Ordre des blocs de l'accueil :

1. **Accroche** de une ou deux phrases, au « je » (texte d'auteur, voix Encre) : un fait et sa
   conséquence pour le lecteur, jamais une description de la page.
2. **Démonstration vivante** : un graphique (`LineChart`) et un indicateur (`KpiCard`) rendus par
   les composants du système sur des données réelles du dépôt (par exemple les mesures de
   `proofs.json` régénérées), avec leur tableau lié. C'est la preuve visible et la vitrine de la
   visualisation de données (ADR-0007).
3. **Deux entrées**, une par lecteur : « Juger le travail » (Preuves, Décisions, Architecture) et
   « Utiliser le système » (Démarrer).
4. **Chiffres sourcés**, chacun avec son fichier et sa date de mesure (règle éditoriale
   d'`AGENTS.md`).

Les textes au « je » gardent `DraftNotice` tant que Paul ne les a pas relus (#112).

## Décision 2 : navigation à six entrées

En-tête, six liens au plus (convention : un menu court se lit d'un coup d'œil, aucune étude
n'en fixe le nombre) : **Démarrer**, **Composants**, **Données**, **Preuves**, **Auteur**, et la
**Recherche**. L'accueil est la marque. Architecture, Décisions, Identité et PWA passent dans une
colonne « Le fond » du pied de page, avec les pages légales et le glossaire ; `Preuves` renvoie vers
Architecture et Décisions. Le sommaire des composants reste groupé (8 groupes). Aucune page
disparaît : seule sa place dans les menus change.

## Décision 3 : « Démarrer » dit l'état réel

Une page, quatre étapes (installer, générer ou ajouter, régler la teinte et la police, vérifier),
dont le réglage en une ligne : `--accent-hue` et `--font-stack` de `create` (#151, D-068). Tant que
rien n'est publié (`0.x`), la page l'écrit en tête et donne la commande qui marche aujourd'hui
depuis le dépôt ; les commandes `npx` sont marquées « après la première publication ». Aucune
commande n'est présentée comme exécutable si elle ne l'est pas.

## Décision 4 : une section « Données »

Une page `/donnees/` regroupe `LineChart`, `BarChart`, `AreaChart`, `GaugeChart`, `Sparkline`,
`KpiCard`, `DataTable` et `Legend` : un exemple chacun, le jeu de données affiché, le code à copier,
le renvoi vers l'ADR-0007. Les fiches de composants existantes restent la référence.

## Décision 5 : voix et textes

Tous les textes du site suivent `encre-voix` : précis, posé, sobre ; accroche directe en tête de
page ; « je » dans les textes d'auteur, neutre dans la documentation technique ; aucun chiffre sans
source (`[A VERIFIER]` sinon). Les écarts de l'audit sont corrigés avec la voix : nombre de paquets,
projets de la régression Visuel, « design system », apostrophe typographique, preuves régénérées.

## Décision 6 : identité et budgets

L'identité Encre s'applique sans nouveau jeton : mêmes polices, mêmes tailles, un accent rare.
Budget provisoire, **convention** : aucune page ne dépasse sa mesure de l'audit en HTML et en CSS
(accueil : 15,2 ko et 21,1 ko) sans justification écrite ; le budget bloquant vient de l'étape 10
(#102). Zéro JavaScript requis pour lire : inchangé.

## Décision 7 : tests avec des visiteurs

Au moins trois personnes extérieures au projet : étape **manuelle**, hors de portée d'un agent.
Protocole proposé à Paul : trois tâches (trouver l'installation, trouver une preuve d'accessibilité,
trouver un graphique), temps et blocages notés, aucun enregistrement d'identité. #123 reste ouverte
tant que cette étape n'est pas faite.

## Découpage

| Sous-issue | Contenu                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| #164       | audit et cette ADR                                                        |
| accueil    | décision 1                                                                |
| démarrer   | décision 3                                                                |
| textes     | décision 5 : écarts de l'audit, voix des pages d'auteur et d'architecture |
| navigation | décision 2                                                                |
| données    | décision 4                                                                |
| tests      | décision 7 (Paul)                                                         |

## Points ouverts et risques

1. Le nombre de six entrées et le regroupement du pied de page sont des conventions : à valider.
2. La démonstration de l'accueil dépend des composants de visualisation (déjà livrés, V2a à V3b) ;
   les données doivent venir d'un fichier du dépôt, jamais écrites à la main dans la page.
3. Les commandes de « Démarrer » ne seront exécutables qu'après la première publication
   (étape manuelle de Paul, #108).
