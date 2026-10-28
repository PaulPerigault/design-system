# Jeton de release-please

Une PR créée avec le `GITHUB_TOKEN` d'un workflow ne déclenche aucun autre workflow (règle de
GitHub contre les boucles) : `ci`, requis par le ruleset de `main`, ne tourne pas sur la PR de
release et sa fusion reste bloquée. Il faut un jeton qui n'est pas celui du workflow (D-036).

| Critère       | Jeton fine-grained (PAT)                        | GitHub App dédiée                               |
| ------------- | ----------------------------------------------- | ----------------------------------------------- |
| Mise en place | 1 jeton, 1 secret                               | 1 App, installation, clé privée, ID, 2 secrets  |
| Étape dans CI | aucune                                          | `actions/create-github-app-token` à chaque run  |
| Durée de vie  | expiration obligatoire (90 jours conseillés)    | jeton d'installation d'une heure, clé sans date |
| Identité      | le compte de Paul (PR et commits à son nom)     | bot dédié                                       |
| Droits        | Contents et Pull requests en écriture, ce dépôt | les mêmes, ce dépôt                             |
| Rotation      | à la main tous les 90 jours                     | rotation de clé, rare                           |

**Recommandation : le jeton fine-grained.** Pour un dépôt personnel à un seul mainteneur, il évite
une App, une clé privée et une action tierce de plus à épingler. Coût accepté : une rotation
trimestrielle (issue `[Paul]` dédiée). Une App se justifierait avec plusieurs dépôts ou mainteneurs.

## Création du secret sans trace

`docs/manual-steps.md` §11 : `Read-Host -AsSecureString` lit la valeur sans l'afficher ; elle est
convertie en texte en mémoire seulement, puis passée à `gh secret set` par l'entrée standard. Rien
n'est écrit dans un fichier, un argument de commande ni l'historique PowerShell.
