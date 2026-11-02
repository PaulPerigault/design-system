---
name: encre-rendu-ia
description: Passe critique avant livraison d'une page ou d'un composant, pour traquer les marques d'un rendu fait par IA qu'`encre-design` ne couvre pas (cartes identiques, gros chiffre, bordure latérale, mono décoratif) et ranger les défauts par gravité. « passe finale », « polish », « ça fait IA ».
---

# Encre : passe critique du rendu « fait par IA »

Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Complète `encre-design`
(direction, couleur, typographie, graphiques) sans le répéter : ici, les marques de rendu automatique
qui n'y figurent pas, et l'ordre d'une passe finale. Skill réécrit depuis une source tierce
(`PROVENANCE.md`) ; en cas d'écart, `AGENTS.md` gagne. Méthode, pas preuve : « prouvé » seulement si
une source l'établit, sinon « convention » ou « préférence ».

## Surcharges Encre

- Aucun sous-agent : la passe se fait dans la session, une seule à la fois. Aucun instantané ni
  dossier d'état écrit dans le dépôt ; le rapport va dans la réponse, ou dans `tmp/` (jamais commité).
- Aucun détecteur tiers, aucun binaire, aucun hook : le contrôle est la lecture du code et du rendu
  (`encre-design` pour les mesures, `npm run verify` pour les contrôles du dépôt).
- La source dit « ose » et recommande flou, `backdrop-filter`, ombres et grain comme matériaux :
  ici, tout cela reste interdit (`AGENTS.md`, « Interdits anti-IA »). Une exception exige une ADR.
- Design avant code (D-101) : on critique avec l'arborescence et les jetons en main, on ne refait pas
  la conception. Raffiner conserve l'identité existante ; refaire est une autre tâche, à demander.
- Pas de phrase d'accueil imposée, pas de question finale obligatoire. Une PR à la fois.

## Comment l'utiliser

- Phrase de déclenchement : « passe finale de `<page ou composant>` » (ou `/encre-rendu-ia`).
- Lire le code et regarder le rendu à 375 px et à 1280 px, thèmes clair et sombre, avant de juger.
- Sortie : verdict en une phrase, puis les défauts du plus grave au moindre (voir « Rapport »).

## Vocabulaire de revue (un mot, un renvoi)

| Mot      | Sens dans le dépôt                                            | Où                                          |
| -------- | ------------------------------------------------------------- | ------------------------------------------- |
| critique | jugement de conception : hiérarchie, clarté, ce qu'on retient | ce skill, `encre-design`                    |
| audit    | contrôle technique : accessibilité, poids, adaptation         | `encre-mobile`, `encre-greenops`, `check:*` |
| polish   | passe finale avant livraison, par ordre de gravité            | ce skill                                    |
| harden   | états, cas limites, textes longs                              | `encre-cas-limites`                         |
| clarify  | textes d'interface, libellés, messages d'erreur               | `encre-voix`                                |

## Classer chaque écart avant de le corriger

1. **Jeton manquant** : le système a besoin d'une valeur réutilisable (proposer le jeton, ne pas
   écrire la valeur).
2. **Écart ponctuel** : un composant ou un motif existant doit remplacer le code local.
3. **Désaccord de conception** : le parcours ou la hiérarchie diffère de pages comparables.
4. **Défaut local** : l'implémentation est simplement incomplète.

Corriger au plus étroit niveau correct. Un défaut qui revient trois fois est un jeton manquant ou un
composant manquant, pas trois retouches.

## Ordre de la passe

1. Tâche bloquée, donnée perdue, état trompeur, parcours inaccessible au clavier.
2. États absents : chargement, vide, erreur, réussite, désactivé.
3. Parcours, hiérarchie, adaptation, écart avec le système.
4. Incohérences visuelles et de mouvement.
5. Nettoyage du code et des ressources.

Ne pas fignoler un coin en laissant le reste au même niveau : la passe couvre tout le parcours.

## Marques d'un rendu automatique (en plus d'`encre-design`, « Signes d'un rendu générique »)

1. Grille de cartes de même taille « icône, titre, texte » comme structure de page ; cartes imbriquées.
2. Modèle « gros chiffre, petite étiquette, statistiques d'appui, accent » pour dire un fait.
3. Bordure latérale colorée de plus de 1 px sur carte, liste, encadré ou alerte.
4. Texte en dégradé ; ombre à décalage dur sans monde brutaliste ; verre ou flou « parce que ».
5. Courbe minuscule, anneau de progression ou rectangle arrondi ombré qui tient lieu de contenu.
6. Chasse fixe (monospace) employée comme costume « technique » hors code, données ou mesures.
7. Pictogramme en caractère Unicode ou emoji à la place de vrais icônes d'un même trait.
8. Fond rayé ou quadrillé sans canevas, plan ou instrument de mesure dessous.
9. Fenêtre modale pour une tâche qui n'exige ni interruption ni focus protégé.
10. Thème clair ou sombre choisi par catégorie, non par contexte d'usage.
11. Titre creux au lieu d'un fait ; valeur d'exemple donnée pour réelle : étiqueter « exemple ».
12. Surfaces du navigateur laissées par défaut : sélection (`::selection`), curseur (`caret-color`),
    cases (`accent-color`), décalage de soulignement, barre de défilement, chiffres tabulaires.
    Les thémer avec les jetons `--pp-*` : c'est le signe le plus fiable d'une page construite.

## Rapport

1. **Verdict** : une phrase, avec la mesure qui le fonde (contraste, hauteur, poids), jamais « beau ».
2. **Défauts**, du plus grave : numéro, gravité (bloque, gêne, fragile), `fichier:ligne`, classe de
   l'écart, correctif en une ligne.
3. **Ce qui tient** : ce qu'il ne faut pas toucher.
4. **Décisions pour Paul** : les choix de goût, avec une recommandation.

Un détecteur automatique prouve un défaut, jamais une qualité : regarder le rendu à la main.

## Sources

Réécrit le 2026-11-02 depuis un texte sous licence Apache-2.0 : voir `PROVENANCE.md` (URL, SHA,
licence, `NOTICE`, modifications). Aucune étude n'est citée : ces marques sont des conventions de
revue, non des résultats mesurés ; le dépôt ne dit pas « prouvé » pour elles.
