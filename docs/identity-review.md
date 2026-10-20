# Identité : ce que l'orchestrateur a choisi à votre place

À relire quand vous en avez le temps. Rien n'est irréversible : tout passe par
`packages/tokens`. Le détail et la comparaison chiffrée sont dans l'ADR-0002 et sur la page
`/identite/` de la documentation.

| Choix       | Ce qui a été retenu                                                             | Pourquoi                                                                                             | Pour revenir en arrière                                                                  |
| ----------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Direction   | **D. Encre** : la teinte du favicon (270,7) pour les neutres et l'unique accent | Continuité avec le favicon ; meilleur accent mesuré (6,93:1 en clair) ; dans le gamut sRGB           | Remplacer les fichiers de couleur par une direction de `packages/tokens/src/directions/` |
| Fond sombre | Exactement l'encre du favicon `#14161c`                                         | Le favicon devient la surface du mode sombre                                                         | Token `color.bg` (thème sombre)                                                          |
| Accent      | `#3749c3` (clair) / `#9fb4f8` (sombre), même teinte que le favicon              | Un seul accent, cohérent avec la marque                                                              | Token `color.accent`                                                                     |
| Mono        | Atkinson Hyperlegible Mono pour le code et les métadonnées                      | Alignement, 0/O et 1/l/I distincts ; même famille                                                    | Supprimer `font.mono` et ses usages                                                      |
| Rayons      | 4 px (contrôles), 8 px (surfaces), 14 % (marque)                                | Écho des coins du favicon                                                                            | Tokens `radius.*`                                                                        |
| Statuts     | `passed`, `failed`, `degraded`, `running`, avec icône et libellé                | Vocabulaire du métier, sans dépendre de la couleur                                                   | Tokens `color.status.*`                                                                  |
| Intitulé    | « Alternant DevOps Cloud » conservé sur le site                                 | Le contenu du site fait foi et doit rester identique partout ; changer l'intitulé est votre décision | Modifier `src/content/*/ui.json` du portfolio                                            |

Questions ouvertes pour vous :

1. Garder l'intitulé actuel ou passer à « DevSecOps & Cloud » (contenu du site, JSON-LD, llms.txt, OG) ?
2. La police mono vous convient-elle pour les métadonnées (dates, empreintes, statuts CI) ?
