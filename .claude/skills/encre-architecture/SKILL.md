---
name: encre-architecture
description: Revue d'architecture des paquets d'outillage (couches, ports, erreurs typées, sens des dépendances), repérage de code smells et schémas C4 en Mermaid. À charger pour un module nouveau ou déplacé, une revue de dépendances, un schéma d'architecture. « revue d'architecture », « schéma C4 ».
---

# Encre : revue d'architecture et schémas

Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Sources du dépôt :
ADR-0006 (couches, ports, erreurs, DTO), ADR-0005, D-101 (design avant code), `AGENTS.md` (limites,
sens des dépendances). Ce skill ne crée aucune règle : il dit quoi regarder et comment dessiner.
Seule la grille C4 vient d'un texte tiers (`PROVENANCE.md`) ; en cas d'écart, l'ADR gagne.
Réécrit avec une source tierce pour la grille C4 (`PROVENANCE.md`) ; en cas d'écart, l'ADR gagne.

## Surcharges Encre

- Le périmètre des couches est celui d'ADR-0006 : `guards`, `create`, `mcp`, le générateur de
  `tokens`, `web-presence`, `tools/agents`. Les composants Astro et le CSS n'y sont pas soumis.
- Pas de principes SOLID récités : on cite la règle du dépôt (limites de taille, un module = une
  responsabilité) et le fichier:ligne qui la viole.
- Aucune dépendance ni outil de schéma ajouté : Mermaid s'écrit en texte dans la doc, sans rendu
  exécuté par le dépôt. Aucun sous-agent ; une PR à la fois ; design avant code, dans le journal.
- Un schéma n'est pas une preuve : il décrit l'état lu dans le code à une date, il vieillit.

## Comment l'utiliser

- Phrase de déclenchement : « revue d'architecture de `<paquet>` » ou « schéma C4 de `<système>` ».
- Lire les imports avant de juger. Sortie : Critique, À améliorer, Ce qui tient ; `fichier:ligne`.

## Sens des dépendances

- Paquets : `tokens ← css ← astro` et `tokens ← dataviz ← astro` ; un import qui remonte est une
  erreur (`AGENTS.md`). Un crate `-wasm` dépend du crate métier, jamais l'inverse.
- Dans un paquet d'outillage : `infrastructure → application → domain`. `domain` n'importe que
  lui-même et des types ; `application` que `domain` et ses ports ; seul `infrastructure` (et `bin`)
  touche `node:*`.
- Vérification mécanique, à la main : chercher `node:`, `process`, `fetch` sous `domain/` et
  `application/` ; chercher un nom de classe d'adaptateur sous `domain/`. Les interfaces de ports
  (`FileSystem`, `Clock`) sont attendues côté application : chercher les implémentations, non le mot.
- Le point d'entrée (`bin`, composition) est la couche la plus externe : lui seul assemble les ports.

## Ce qui franchit une frontière

- Entrée : JSON, argument, fichier, réponse, sortie WebAssembly : validée en un type du domaine ou en
  erreur typée (`errors.ts`, union fermée à champ `code`). Le domaine ne reçoit rien de non validé.
- Sortie : des valeurs simples ou des types du domaine, jamais un objet d'infrastructure.

## Code smells à repérer (convention, non norme)

| Signe                                           | Où le voir                             | Réponse du dépôt                     |
| ----------------------------------------------- | -------------------------------------- | ------------------------------------ |
| Fichier ou fonction hors limite                 | `npm run check:size`, lint             | découper, ne pas relever la limite   |
| Module `utils`, `helpers`, `common` fourre-tout | arborescence                           | nommer par responsabilité (D-101)    |
| Paramètres en rafale (plus de 4)                | signatures                             | objet nommé du domaine               |
| Complexité au-dessus de 8, imbrication de 3+    | lint                                   | extraire une fonction pure           |
| Nombre magique, `any`, `as`                     | guards, lint                           | constante nommée, type, validation   |
| Couplage au FS, au réseau, à l'horloge          | imports `node:*` hors `infrastructure` | injecter un port                     |
| Duplication à la deuxième occurrence            | revue, `check:duplication` s'il existe | extraire à la deuxième, jamais avant |
| Erreur anonyme (`throw new Error(...)`)         | frontières                             | erreur typée de `errors.ts`          |
| Abstraction sans second usage                   | module d'une seule implémentation      | supprimer, garder la fonction        |

## Schémas C4 en Mermaid

Choisir le niveau selon le lecteur ; contexte et conteneurs suffisent à la plupart des équipes.

| Niveau | Type Mermaid   | Pour qui      | Quand                                          |
| ------ | -------------- | ------------- | ---------------------------------------------- |
| 1      | `C4Context`    | tout le monde | toujours : système, acteurs, systèmes externes |
| 2      | `C4Container`  | technique     | toujours : sites, paquets, services, `.wasm`   |
| 3      | `C4Component`  | développeurs  | seulement si cela apprend quelque chose        |
| 4      | `C4Deployment` | exploitation  | pour la mise en ligne (Pages, workflows)       |
| -      | `C4Dynamic`    | technique     | un flux numéroté (build, publication)          |

Règles : un titre par schéma ; chaque flèche porte un verbe et, si besoin, la technologie ; pas de
boîte sans description ; au plus une douzaine d'éléments, sinon scinder. Écrire le schéma dans un
fichier de `docs/` avec la date de lecture et les fichiers qui l'établissent. Le C4 de Mermaid serait expérimental
([À VÉRIFIER], page non ouverte) : tester le rendu avant de le citer comme livré.

## Rapport

Critique (règle violée, `fichier:ligne`), À améliorer, Ce qui tient. Un défaut qui revient est un
module manquant, pas plusieurs retouches. Décisions de goût : à Paul, avec une recommandation.

## Sources

Réécrit le 2026-11-02 : ADR-0006 pour le fond ; un texte tiers pour la grille C4,
sous licence MIT (`PROVENANCE.md`). Les noms de niveaux C4 viennent du modèle C4 (Simon
Brown) : [À VÉRIFIER] sa page de référence n'a pas été ouverte pour ce skill.
