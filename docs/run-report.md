# Rapport d'exécution

Mis à jour à chaque fin de lot. Dernière mise à jour : 2026-10-20, fin de L2.

## Lots

| Lot | Statut   | Bilan                                       |
| --- | -------- | ------------------------------------------- |
| L0  | terminé  | [docs/lots/L0.md](lots/L0.md)               |
| L1  | terminé  | [docs/lots/L1.md](lots/L1.md)               |
| L2  | terminé  | [docs/lots/L2.md](lots/L2.md)               |
| L3  | en cours | primitives de layout (variants livré en L2) |

## Proportion Kiro / Claude

| Lot | Tâches Kiro    | Tâches Claude      | Crédits Kiro          |
| --- | -------------- | ------------------ | --------------------- |
| L0  | 0              | 10 (orchestrateur) | < 0,1 (vérifications) |
| L1  | 1 (+ 3 revues) | 0 (orchestration)  | 10,63                 |

## PR ouvertes

- Portfolio #267 (garde-fous de l'assistant) : fusionnée dans `develop`.
- Design system #1 (L0) : fusionnée dans `develop`.
- Portfolio #269 (IaC du dépôt design-system) : fusionnée dans `develop` ; **apply en attente du propriétaire**.
- Design system #2 (L1) : fusionnée dans `develop`.

## Actions du propriétaire

Voir [docs/manual-steps.md](manual-steps.md) : extension des jetons GitHub, `apply` OpenTofu,
trusted publisher npm (et `0.0.0` d'amorce si nécessaire), fusions vers `main`.
