# Politique de sécurité

## Signaler une vulnérabilité

Ne publiez pas de ticket public. Utilisez le signalement privé de GitHub :
<https://github.com/PaulPerigault/design-system/security/advisories/new>.

Indiquez la version concernée, les étapes pour reproduire et l'effet constaté. Le même contact
figure dans `/.well-known/security.txt` (RFC 9116) du site de documentation.

Objectif de réponse : accusé de réception sous 7 jours. C'est un objectif d'un projet personnel
maintenu par une seule personne, pas un engagement contractuel.

## Versions suivies

Les paquets `@paulperigault/*` sont en version `0.x`. Seule la dernière version publiée reçoit des
correctifs.

## Ce que le dépôt met en place

- Publication uniquement par le workflow `release` (trusted publishing OIDC, provenance npm), sans
  jeton de publication stocké.
- Installation avec `--ignore-scripts`, liste blanche des scripts d'installation
  (`tools/checks/check-install-scripts.mjs`), `npm audit signatures` et `npm audit` en CI.
- SBOM CycloneDX par paquet à chaque release (artefact du workflow) et à chaque exécution de
  `supply-chain`.
- Actions GitHub épinglées par SHA ; mises à jour par Dependabot avec un délai de 3 jours avant
  l'adoption d'une nouvelle version (7 jours pour une majeure) ; correctifs et mineures fusionnés
  automatiquement quand la CI est verte, majeures relues à la main.
- Analyse CodeQL, OpenSSF Scorecard, recherche de secrets (secretlint).
- Site de documentation : politique de sécurité du contenu (CSP) par hachages, sans ressource
  tierce à l'exécution (voir `docs/adr/` pour les en-têtes).
