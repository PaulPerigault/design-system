# Design system « à la shadcn » pour paulperigault.fr : analyse critique, preuves vérifiées et plan d'exécution pour Claude Code

Le plan de Paul est solide sur le fond : la règle « prouvé / convention / préférence », les garde-fous CI et la brique indépendante sont du bon travail. Mais il tient pour prouvées plusieurs choses que ses sources n'établissent pas : Sahito 2015 sert à justifier 60–75 ch alors que l'étude montre une préférence pour 90 cpl ; l'avantage du clair « pour les petits textes » vient de Piepenbrock 2014 (Human Factors) et non de 2013 ; Atkinson Hyperlegible n'a aucune étude indépendante publiée ; Oklab n'est qu'approximativement uniforme. Il sous-estime aussi trois pièges techniques : `light-dark()` combiné à une bascule manuelle, un contraste calculé sur du hex alors que la source sera en OKLCH, et une Container API Astro toujours expérimentale. Ma recommandation : garder l'architecture, mais passer les tokens au format DTCG 2025.10, aligner le registre sur le schéma shadcn au lieu de le réinventer, et livrer par paliers (fondations → composants → registre → starter).

## TL;DR

- **Preuves :** la moitié des décisions du tableau sont légitimes une fois reformulées, l'autre moitié extrapole. La mesure de 60–75 ch est une convention, pas un résultat de Sahito. La police n'a aucune validation empirique indépendante. Le 7:1 pour le texte courant est un choix AAA (WCAG 1.4.6), défendable mais coûteux pour l'accent et le texte atténué. WCAG 3.0 (brouillon du 10 septembre 2026) n'a toujours pas d'algorithme de contraste : WCAG 2.2 bloquant et APCA informatif est le bon arbitrage.
- **Architecture :** le modèle `design-system/` calqué sur `worker/` est le bon, avec trois changements : une source de tokens au format DTCG 2025.10 (stable depuis le 28 octobre 2025) plutôt qu'en TS maison ; un `registry.json` conforme au schéma shadcn, avec une CLI maison mince par-dessus ; des tests de contraste calculés sur la couleur sRGB réellement rendue, avec une palette contrainte au gamut sRGB.
- **Exécution :** 9 épiques, une quarantaine de tâches atomiques et 4 points [VALIDATION PAUL]. Fondations et identité sont séquentielles ; composants, docs et guards se parallélisent dans des worktrees isolés, avec propriété exclusive des fichiers par agent. Le « create » du starter vient en dernier : c'est la partie la plus chère et la moins utile à court terme.

## Key Findings

1. **Le dépôt est public et confirme le contexte**, avec des incohérences à corriger avant le design system :
   - Stack du README : Astro 7, Node 24, Tailwind v4, Effect, Vitest, Playwright, Lighthouse CI, release-please, CodeQL, Docker/Nginx, GitHub Pages. Fichiers présents : `CLAUDE.md`, `.claude/`, `eslint.design-rules.mjs`, `knip.json`, `infra/`.
   - Le dépôt versionne `.angular/cache/22.2.0/paul-portfolio` et affiche encore le topic « angular » : un reliquat de l'ancienne stack qui fait désordre pour un profil DevSecOps.
   - Le README dit « Alternant DevOps Cloud » alors que le positionnement visé est DevSecOps & Cloud.
2. **Erreurs factuelles ou attributions inexactes dans le plan :**
   - (a) « Petits textes = clair » vient de Piepenbrock, Mayr & Buchner 2014 (*Human Factors* 56(5)), pas de l'article *Ergonomics* 2013.
   - (b) Sahito et al. 2015 conclut à une préférence pour 90 cpl et ne justifie pas 60–75 ch. L'effectif de 70 participants n'a pas pu être vérifié.
   - (c) Kuster et al. 2018 porte sur la police Dyslexie, pas sur OpenDyslexic, évaluée par Wery & Diliberto 2017.
   - (d) « Perceptuellement uniforme » pour Oklab est une approximation : optimisé pour l'uniformité d'apparence à partir de données synthétiques CAM16, il prédit mal les écarts mesurés (STRESS 47,35 contre 29,13 pour CIEDE2000 sur COMBVD, préprint indépendant de 2026).
3. **Points « à vérifier » du plan, désormais vérifiés :** WCAG 2.5.5 (AAA) exige bien 44 × 44 px CSS, avec exceptions (Equivalent, Inline, User Agent Control, Essential) ; WCAG 2.5.8 (AA) exige 24 × 24 px, avec une exception d'espacement définie par un cercle de 24 px de diamètre.
4. **Le plus gros risque technique** est le couplage `light-dark()` / bascule manuelle / `THEME_COLOR`. `light-dark()` ne suit que `color-scheme` : une bascule par attribut doit forcer `color-scheme` sur la racine, faute de quoi le thème manuel ne change aucune couleur définie par `light-dark()`.
5. **La sur-ingénierie menace surtout le périmètre « CLI à cinq commandes + starter + mode copié ».** Pour un seul utilisateur, la valeur vient d'abord de fondations testées et de composants accessibles ; le scaffolding passe en dernier.

## 1. Vérification des sources citées, une par une

### 1.1 Atkinson Hyperlegible, Next et Mono

**Faits vérifiés :**
- Police créée en 2019 par Applied Design Works pour le Braille Institute of America, licence SIL OFL.
- Pendant le développement, le Braille Institute a fait tester le prototype par des personnes malvoyantes, caractère par caractère, puis sur des mots et des phrases (Elliott Scott, Design Week).
- Atkinson Hyperlegible Next est sortie le 10 février 2025 (communiqué du Braille Institute) : sept graisses (ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold), chacune en romain et en italique, plus une version variable ; plus de 150 langues contre 27 ; une variante Mono qui, selon le communiqué, « est conçue spécifiquement pour aider les développeurs, en améliorant la lisibilité là où l'espacement précis des caractères est critique ». La page officielle (brailleinstitute.org/freefont) annonce « 370 glyphes par style » pour Next et 373 pour Mono.

**Ce qui manque : toute étude empirique indépendante.**
- Les tests du Braille Institute n'ont pas été publiés : ni protocole, ni effectifs, ni mesures.
- Interrogée sur l'usage de données scientifiques, l'équipe a répondu en substance que le dessin « vient de la tradition du dessin de caractères » et que « ce n'est pas vraiment de la rocket science » (compte rendu de Max Kohler, 2021).
- Aucune étude revue par les pairs n'a été trouvée sur Next ou Mono.

**Verdict :** « police à glyphes distincts, auto-hébergée, changement = ADR » est légitime comme **préférence argumentée**. La différenciation des glyphes (l/I/1, 0/O, b/d/p/q) est un principe typographique solide, pas une preuve d'effet sur la lecture. La réserve du plan est juste ; il faut ajouter qu'il n'existe **aucun gain démontré non plus pour les malvoyants dans une publication indépendante**. Reformulation : « police choisie pour la différenciation des glyphes, propriété revendiquée par l'éditeur, non validée par une étude indépendante ». La mention « Google Fonts depuis 2021 » est confirmée par une source secondaire (Wikipedia, « Atkinson Hyperlegible ») : la police y a été publiée en 2021 sous licence SIL OFL ; le communiqué de 2025 confirme la disponibilité de Next sur Google Fonts.

### 1.2 Thème clair/sombre : Piepenbrock 2013, Dobres 2017, Legge 1985, Aleman 2018

- **Piepenbrock, Mayr, Mund & Buchner 2013** (*Ergonomics* 56(7):1116–1124) : jeunes de 18 à 33 ans et âgés de 60 à 85 ans à vision normale, polarité en inter-sujets. Avantage du clair pour l'acuité et la relecture dans les deux groupes ; aucun effet sur la fatigue. Les auteurs notent que l'avantage aurait pu diminuer chez des patients atteints de cataracte, non testés.
- **Piepenbrock, Mayr & Buchner 2014** (*Human Factors* 56(5):942–951) : c'est **cette** étude qui établit que l'avantage du clair « augmente linéairement quand la taille des caractères diminue ». Le plan doit la citer pour sa règle sur les petits textes.
- **Dobres, Chahine & Reimer 2017** (*Applied Ergonomics* 60:68–73) : décision lexicale « à un coup d'œil ». De jour simulé, **pas d'effet de polarité** ; de nuit, avantage du clair, et petit texte en sombre nettement plus difficile. Cela soutient « sombre = taille de corps minimale », mais la tâche porte sur un ou deux mots, pas sur une lecture suivie.
- **Legge et al. 1985** : les 7 participants à milieux oculaires troubles lisaient mieux en polarité négative ; ceux atteints de troubles de la vision centrale n'étaient pas affectés. C'est l'argument solide en faveur de la **bascule manuelle**.
- **Aleman, Wang & Schaeffel 2018** (*Scientific Reports* 8:10840) : 7 participants ayant lu une heure dans chaque polarité (effectif confirmé par Nielsen Norman Group) ; après une heure, la choroïde s'amincit de −16,13 ± 4,54 µm avec le texte noir et s'épaissit de +9,96 ± 6,51 µm avec le texte blanc (yeux regroupés). **Marqueur de substitution à court terme**, sans démonstration que le mode clair cause la myopie.

**Verdict :** « clair = référence pour petits textes » est **prouvé** chez les personnes à vision normale (Piepenbrock 2014) ; « sombre avec taille minimale » est **soutenu** (Dobres 2017, Piepenbrock 2014) ; la bascule manuelle est **soutenue** pour une sous-population (Legge 1985) ; « thème suit le système » est une **convention** qu'aucune de ces études ne teste. Aleman ne doit justifier **aucune** décision.

### 1.3 Longueur de ligne : Sahito 2015 et la littérature

- **Sahito et al. 2015** (« Significance of Line Length for Tablet PC Users ») : la majorité préfère 90 cpl, une partie des 35–40 ans préfère 60. C'est une **préférence**, pas une performance, dans une revue de faible visibilité.
- **Dyson & Haselgrove 2001** (*IJHCS* 54:585–612) : 55 cpl « semble favoriser une lecture efficace » à vitesse normale comme rapide, avec la meilleure compréhension et une lecture plus rapide que les lignes courtes (comparaison longue à 100 cpl).
- **Shaikh 2005** (20 étudiants, 35/55/75/95 cpl) : 95 cpl lu le plus vite, aucun effet sur la compréhension ni la satisfaction, préférences polarisées (60 % choisissent 35 ou 95 cpl).
- **Dyson 2004** (revue) : lignes longues souvent lues plus vite, effet incohérent sur la compréhension. **Bernard et al.** ne sont cités ici que via la littérature secondaire.

**Verdict :** la littérature écran ne converge pas. La fourchette « ~60–75 ch » est une **convention typographique** issue de l'imprimé (Bringhurst : 45–75, idéal 66), défendable, mais pas un résultat de Sahito, qui pointerait plutôt vers ~90.

**Piège technique non vu par le plan :** `1ch` est la largeur du glyphe « 0 », plus large que le caractère moyen. Avec une police large comme Atkinson, `max-inline-size: 65ch` peut produire environ 70–80 caractères réels. Il faut un test Playwright qui **mesure** le cpl rendu sur un paragraphe de référence, et calibrer le token d'après cette mesure.

### 1.4 Espacement du texte : WCAG 1.4.12

Les valeurs sont exactes : interligne ≥ 1,5, paragraphe ≥ 2 ×, lettres ≥ 0,12 em, mots ≥ 0,16 em. Le critère exige **aucune perte de contenu ni de fonctionnalité** quand l'utilisateur applique ces valeurs ; il n'impose pas ces valeurs par défaut. Le test e2e qui les injecte est exactement le bon (**norme**) ; l'interligne par défaut reste une **convention** (voir Rello 2016, section 2).

### 1.5 Cibles : WCAG 2.5.8 et 2.5.5

- **2.5.8 Target Size (Minimum), AA**, nouveau en 2.2 : 24 × 24 px CSS ; les cibles plus petites sont admises si un cercle de 24 px de diamètre centré sur chacune ne touche aucune autre cible ni le cercle d'une autre cible sous-dimensionnée ; exceptions Equivalent, Inline, User Agent Control, Essential.
- **2.5.5 Target Size (Enhanced), AAA** : 44 × 44 px CSS, avec les exceptions Equivalent, Inline, User Agent Control et Essential.

Décision recommandée : `--pp-target-min: 24px` bloquant (norme AA) ; `--pp-control-height: 44px` pour les contrôles primaires (Button, Input, Select, ThemeToggle), présenté comme un **choix AAA** ; liens en ligne exemptés.

### 1.6 Couleur : CSS Color 4, oklch(), Oklab

Oklab a été publié par Björn Ottosson en 2020 dans un **billet de blog**, pas dans un article revu par les pairs. Il est ajusté sur des paires synthétiques CAM16 (clarté, chroma) et des données d'uniformité de teinte IPT, et corrige le défaut connu de CIELAB dans les bleus. Évaluation indépendante : Uchida 2026 (préprint arXiv 2606.05255, non revu) sur COMBVD (3 813 paires, six jeux de données) donne un STRESS de 47,35 pour Oklab contre 29,13 pour CIEDE2000, et souligne que « l'uniformité d'apparence ne garantit pas l'uniformité de discrimination ».

**Verdict :** écrire « **approximativement** uniforme en apparence ; bon pour construire des rampes et interpoler, mauvais pour mesurer des écarts ». Conséquences : (1) OKLCH est le bon espace **auteur** ; (2) le L d'OKLCH **n'est pas** la luminance relative de WCAG, donc le contraste se calcule après conversion OKLCH → sRGB (CSS Color 4) et gamut mapping.

### 1.7 Contraste : WCAG 3.0 et APCA en octobre 2026

- La version publiée sur w3.org/TR/wcag-3.0 est le « W3C Working Draft 10 September 2026 ».
- Le glossaire indique que « l'algorithme de contraste utilisé dans WCAG 3 reste à déterminer » ; l'exigence « Text contrast sufficient (minimum) » contient littéralement « @@[contrast measure to be determined] » (document de support daté du 31 juillet 2026).
- Selon Adrian Roselli (avril 2026), APCA avait été marqué pour retrait du contenu exploratoire début 2023.
- Un document de travail (« inapproprié de le citer autrement que comme travail en cours ») ne déprécie rien.

**Verdict :** « ratios WCAG 2.2 bloquants ; APCA informatif » est **la bonne décision**. Garder le calcul APCA dans un rapport non bloquant de `check:tokens` pour repérer les paires sombres que WCAG 2 surestime : critique documentée, pas une norme.

### 1.8 Le 7:1 pour le texte courant (WCAG 1.4.6 AAA)

WCAG 1.4.6 demande 7:1, ou 4,5:1 pour le grand texte (≥ 18 pt, ou ≥ 14 pt en gras). Pour le **texte courant**, c'est sans contrainte : un quasi-noir sur blanc tourne autour de 15–18:1. Le coût porte sur quatre rôles :
- **Texte atténué :** à 7:1, il se distingue à peine du texte principal ; la hiérarchie doit passer par la taille, la graisse et l'espace.
- **Accent comme texte (liens) :** en clair, 7:1 sur blanc impose une clarté OKLCH d'environ 0,45 ou moins selon la teinte (ordre de grandeur à valider par le test) ; on perd la vivacité. En sombre, l'accent doit être très clair.
- **Texte sur accent (boutons pleins) :** 7:1 sur une couleur saturée est souvent impossible sans quasi-noir ou quasi-blanc.
- **Thème sombre :** le gris atténué doit monter très haut en clarté.

**Décision recommandée** (jugement explicite) : 7:1 bloquant pour `text/bg` et `text/surface` ; 4,5:1 bloquant pour `text-muted`, `link`, `on-accent`, avec 7:1 visé et signalé ; 3:1 bloquant pour les filets de contrôle et l'anneau de focus (1.4.11, 2.4.13) ; liens toujours soulignés. C'est un AAA partiel, à écrire comme tel dans l'ADR, sans jamais revendiquer une « conformité AAA ».

## 2. Études complémentaires que le plan oublie

| Sujet | Étude | Ce qu'elle établit | Robustesse | Décision token / test |
|---|---|---|---|---|
| Taille du corps | Rello, Pielot & Marcos 2016 (CHI, « Make It Big! ») | Eye-tracking, 104 participants, Wikipedia, 10–26 pt : lisibilité objective et compréhension progressent jusqu'à 18 pt ; interligne (0,8–1,8) à effets marginaux | Bonne, mais un seul site et un seul affichage | Corps fluide, minimum 1,125 rem (18 px), visée 1,25 rem (préférence). 18 pt CSS = 24 px : ne pas transposer littéralement |
| Taille et acuité | Legge & Bigelow 2011 (J. Vision) | Taille critique d'impression et plage de lecture fluide en angle de x-height | Solide (psychophysique), non relu ici | Polices à grande x-height ; taille minimale documentée |
| Interligne | Rello 2016 ; Chung 2004 | Peu d'effet en vision centrale ; bénéfice surtout en vision périphérique | Moyenne ; Chung non relu | `--pp-leading-body: 1.5` (convention) et test 1.4.12 |
| Polices « dyslexie » | Wery & Diliberto 2017 (*Annals of Dyslexia* 67) ; Kuster et al. 2018 (*Annals* 68:25–42) | OpenDyslexic puis Dyslexie : aucun gain de vitesse ni de précision ; Dyslexie non préférée par les enfants | Bonne et convergente | Pas de police « dyslexie » ; investir dans taille, espacement, longueur de ligne |
| Sérif, sans, mono | Rello & Baeza-Yates 2016 (ACM TACCESS) | 97 participants dont 48 dyslexiques : sans empattement, monospace (Courier seulement) et romain meilleurs que sérif, proportionnel et italique ; préférence subjective pour les proportionnelles | Moyenne ; une seule mono, sur de la prose | Pas d'italique pour l'emphase longue ; pas de raison d'imposer un sérif |
| Mono pour le code | Aucune étude revue sur JetBrains Mono, IBM Plex Mono ou Atkinson Mono | Seul un projet étudiant à 6 mesures valides (blog) trouve un temps par mot plus long avec JetBrains Mono | Nulle | Mono justifiée par sa fonction (alignement, 0/O, 1/l/I, diff), réservée au code et aux métadonnées |
| Justification | Pas d'étude vérifiée ici | Consensus d'accessibilité contre le justifié | Convention | `text-align: start` imposé dans `design-rules` |
| Couleur seule | WCAG 1.4.1 | L'information ne passe pas par la seule couleur | Norme | Statuts avec icône et libellé ; simulation deutéranopie/protanopie sur le styleguide |
| Mouvement | WCAG 2.3.3 (AAA) ; `prefers-reduced-motion` | Animations d'interaction désactivables | Norme | `--pp-duration-*` à 0 sous `reduce` ; e2e `reducedMotion: 'reduce'` |
| Focus | WCAG 2.4.7 (AA), 2.4.11 (AA), 2.4.13 (AAA) | 2.4.13 : aire ≥ périmètre de 2 px CSS, contraste ≥ 3:1 entre états | Norme | `--pp-focus-width` ≥ 2 px (3 conseillé) ; test anneau/fond ≥ 3:1 ; non-masquage sous la navbar (2.4.11) |
| Première impression | Lindgaard et al. 2006 (*Behaviour & IT* 25(2)) | Attrait jugé en 50 ms : r ≈ 0,97 entre 50 et 500 ms sur les moyennes (22, 31 et 40 participants selon Tuch et al. 2012) ; individus moins cohérents à 50 ms | Bonne pour l'attrait moyen ; ni confiance ni conversion | Hero lisible et sobre dès le premier écran |
| Beau = utilisable | Tractinsky, Katz & Ikar 2000 (*Interacting with Computers* 13(2)) | 132 étudiants, simulateur de distributeur : forte corrélation esthétique/utilisabilité perçues, avant et après usage | Corrélationnelle, courte durée | Soigner l'esthétique sans sacrifier l'utilisabilité |
| Complexité et couleur | Reinecke et al. 2013 (CHI) | 450 sites, 548 volontaires : complexité, colorfulness et démographie expliquent 48 % de la variance des préférences esthétiques (R² ajusté = 0,48) à 500 ms | Bonne ; modèles calculables | Palette restreinte (1 accent), un point focal par section |
| Prototypicalité | Tuch et al. 2012 (IJHCS) | Faible complexité et forte prototypicalité favorisent la première impression | Moyenne | Rester reconnaissable comme portfolio : originalité dans les détails |
| Cohérence, confiance | Pas d'étude primaire relue ici | — | Convention / non établi | Un composant = une apparence ; tester qualitativement auprès de 3–5 pairs (méthode, pas preuve) |

## 3. Appliquer un sujet « profil tech » sans cliché

**Principe :** l'identité doit montrer **comment Paul travaille** (traçabilité, vérification, décisions écrites, sécurité par défaut), pas reprendre l'imagerie du hacker (vert sur noir, scanlines, glitch, effet machine à écrire). Lindgaard et Reinecke récompensent la faible complexité, Tuch la prototypicalité : le « tech » doit rester une **sémantique**, pas une décoration.

**Vocabulaire tiré du métier** (préférence, pas preuve) :
- **États = statuts de pipeline :** `success`, `warning`, `danger`, `info` se nomment côté interface `passed`, `degraded`, `failed`, `running`, toujours avec icône et libellé. Badge devient `Status`, et les projets affichent l'état réel de leur CI (le site lit déjà GitHub au build via Effect).
- **ADR visibles :** une page `/decisions` rendue depuis `docs/adr/`, preuve d'ingénierie lisible par un recruteur.
- **Diff et journaux :** `Diff` (`ins`/`del` avec signes + et −) pour le changelog du design system ; `Log` en mono avec horodatage ISO pour la timeline.
- **Provenance :** hash de commit, date de build, liens vers le SBOM (déjà produit par `security.yml`) et vers le run CI dans le pied de page.
- **Mono avec parcimonie :** Atkinson Hyperlegible Mono est cohérente avec la famille et raconte l'accessibilité ; JetBrains Mono et IBM Plex Mono sont des alternatives. Aucune n'a de données de lisibilité : mono pour code, identifiants, hash et métadonnées, jamais pour la prose.

**Ce qu'on peut apprendre des systèmes publics** (conventions, non revérifiées ici) :
- **GOV.UK Design System :** chaque composant documente recherches et problèmes connus. Reprendre ce format pour le registre (« Recherche / Preuve / Réserve »).
- **Primer (GitHub) :** tokens fonctionnels nommés par rôle ; un système d'ingénieurs peut rester sobre.
- **Radix Colors :** échelles à 12 pas avec un usage par pas. C'est le bon modèle de rampe OKLCH, avec rôle et contraste minimal testés par pas.
- **Open Props :** custom properties nues, référence pour le nommage `--pp-*`.
- **Every Layout** (Heydon Pickering, Andy Bell) : Stack, Cluster, Sidebar, Switcher, Center, Cover, intrinsèques et sans media queries. À reprendre telles quelles : meilleur investissement du tier 1.

**Trois directions pour l'ADR-0008** (pistes à soumettre à Paul, contraintes par les tests de la section 1) :

| | A. « Runbook » | B. « Blueprint » | C. « Signal » |
|---|---|---|---|
| Idée | Le site comme document d'exploitation : sobre, dense, vérifiable | Le plan d'architecture cloud : grilles, filets fins, cotes | Le monogramme « P » comme signal : une seule couleur forte |
| Palette OKLCH | Neutres chauds (teinte 70–90, chroma ≤ 0,02) ; accent ambre sombre en clair, ambre clair en sombre | Neutres froids (teinte ~250, chroma ≤ 0,03) ; accent bleu « encre de plan » | Neutres purs ; accent unique saturé (vermillon ou vert-de-gris) pour actions et focus |
| Typo | Atkinson Next ; Mono pour méta et code ; ratio 1,2 | Atkinson Next ; Mono pour cotes et étiquettes ; ratio 1,25 | Atkinson Next en grande taille, titres serrés ; ratio 1,333 |
| Formes | Rayons 2–4 px, filets 1 px, pas d'ombre | Rayon 0, grille en filigrane via filets | Rayon pilule pour les contrôles, le reste carré |
| Mouvement | Quasi nul (≤ 120 ms, opacité) | Filets qui se dessinent, sous `no-preference` seulement | Une micro-animation signature (pulse du « P »), désactivée sous `reduce` |
| Ton | Factuel, chiffré (« 0 violation axe ») | Schémas avant texte | Court, affirmatif |
| Risque | Austère | Cliché « plan bleu » | Couleur forte à 7:1 très contrainte |

Mon avis : **A**, avec le système d'états de B. C'est la direction la plus cohérente avec la règle éditoriale, et la plus facile à tenir à 7:1.

## 4. Critique de l'architecture et de la faisabilité (octobre 2026)

### 4.1 Format des tokens : passer au DTCG 2025.10

- Le Design Tokens Community Group a publié le 28 octobre 2025 la première version stable (2025.10), annoncée avec « une prise en charge complète de Display P3, d'Oklch et de tous les espaces de CSS Color Module 4 », les alias, et la gestion des modes clair/sombre, des variantes d'accessibilité et des thèmes de marque « sans duplication de fichiers » via les resolvers. C'est un rapport de Community Group W3C, **pas une Recommandation W3C**.
- Terrazzo se présente comme le seul outil couvrant tout le format DTCG (resolvers et nouveautés 2025.10 dans sa 2.0). Style Dictionary indique que la 2025.10 n'est « pas encore entièrement prise en charge (en cours dans la v5) » ; la v5.3.0 a ajouté le format couleur structuré (14 espaces, dont oklch), la 5.4.0 les dimensions en objet.

**Recommandation :** source en `design-system/tokens/*.tokens.json` (DTCG 2025.10) avec un resolver light/dark ; générateur maison minimal (≤ 120 lignes par fichier) pour le sous-ensemble utilisé (`color`, `dimension`, `duration`, `fontFamily`, `fontWeight`, `number`, `cubicBezier`), produisant `tokens.css`, `theme.css` et un `tokens.d.ts` typé ; `terrazzo check` en devDependency, **en CI seulement**. On gagne l'interopérabilité (Figma, Penpot, Tokens Studio) sans dépendance d'exécution ; le `.d.ts` généré fournit l'autocomplétion du TS maison.

### 4.2 Couleur : contraindre la palette au gamut sRGB

Plutôt que « sortie CSS avec repli sRGB » : **interdire en source toute couleur hors gamut sRGB**, avec un test qui convertit en sRGB linéaire et vérifie chaque canal dans [0, 1]. Un écran P3 n'affichera ainsi jamais une couleur différente de celle dont le contraste a été testé. Le P3 pourra venir via `@media (color-gamut: p3)`, dans un ADR dédié. Corollaires : `contrast.ts` doit apprendre l'OKLCH (Oklab → LMS → sRGB linéaire, puis luminance relative WCAG) ; `contrast.test.ts` doit lire la **source DTCG** et non `tokens.css` par regex, ce qui supprime le couplage `light-dark(#hex, #hex)`.

### 4.3 Support navigateur et replis

Les statuts marqués « vérifié » ont été confirmés dans cette recherche ; les autres viennent de l'état connu du Baseline et sont à revérifier sur webstatus.dev (tâche T1.0).

| Fonction | Statut | Usage et repli |
|---|---|---|
| `oklch()`, `color-mix()` | Baseline largement disponible | Pas de repli si palette sRGB ; `color-mix` pour les états |
| `light-dark()` | Baseline (2024) | Dépend de `color-scheme` : voir 4.4 |
| `@property` | Baseline (2024) | Facultatif |
| Container queries | Baseline | Par défaut dans les patterns |
| `<details name>` | Baseline (2024) | Repli : accordéon non exclusif |
| `<dialog>` + `showModal()` | Baseline largement disponible | OK |
| `closedby` | **Vérifié : limité.** Chrome/Edge 134, Firefox 141 ; Safari non pris en charge (Technology Preview selon caniuse) | Behavior ≤ 20 lignes : clic sur le backdrop → `requestClose()` |
| API popover | Baseline (2024) | Tier 2 |
| Anchor positioning | **Vérifié : Baseline Newly available depuis janvier 2026** avec Firefox 147 (web.dev) ; un article secondaire dit septembre 2026, web.dev fait foi ; sous-propriétés parfois limitées | `@supports (anchor-name: --a)`, sinon positionnement en flux |
| `field-sizing` | Limité | Amélioration progressive pour Textarea |
| `:user-invalid` | Baseline (2023) | Styles d'erreur de Field |
| `text-wrap` | balance : Baseline ; pretty : limité | Titres en balance, prose en pretty |
| `interpolate-size` | Chromium seulement | Animation de `<details>` progressive |
| `@starting-style` | Baseline (2024) | Entrées de dialog et popover |
| View transitions | Même document : Baseline fin 2025 ; inter-documents : limité | Sous `no-preference` seulement ; facultatif |

### 4.4 Tailwind v4 et le piège `light-dark()`

Tailwind v4 se configure en CSS : `@theme` pour exposer les variables, `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));` pour une bascule par attribut (documentation officielle). Une discussion du dépôt Tailwind rappelle que `light-dark()` « ne fonctionne que si `color-scheme` vaut `light dark` ». Implémentation correcte :

```css
:root { color-scheme: light dark; }            /* suit le système */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
@theme inline { --color-bg: var(--pp-color-bg); /* … */ }
```

- `@theme inline` évite que Tailwind fige la valeur ; les `--pp-*` restent la seule source de vérité.
- Le script d'init doit poser `data-theme` **avant le premier rendu** (script inline bloquant dans `<head>`).
- `THEME_COLOR` : deux `<meta name="theme-color" media="(prefers-color-scheme: …)">`, mis à jour par le script quand l'utilisateur force un thème, sinon la barre mobile contredit le thème choisi.

### 4.5 Registre : s'aligner sur le schéma shadcn

Le schéma officiel fournit déjà ce que le plan réinvente : `registry.json` (`$schema`, `items`) ; `registry-item.json` avec `name`, `type`, `files[].path/type/target`, `dependencies`, `registryDependencies`, `cssVars.theme/light/dark`, `css`, `docs`, `categories` et `meta` libre ; les types `registry:base`, `ui`, `component`, `block`, `lib`, `hook`, `file`, `style`, `theme`, `font`, `page`, `item`. La CLI v3+ gère les registres namespacés (`@namespace/item` dans `components.json`) ; `shadcn build` produit les JSON servis ; `shadcn registry validate` valide sans build ; les « GitHub registries » (`owner/repo/item`) se consomment sans build.

**Recommandation :**
- `design-system/registry.json` **conforme à ce schéma** : `foundation` → `registry:style`/`registry:theme`, `primitive`/`pattern` → `registry:ui`/`registry:block`, `behavior`/`lib` → `registry:lib`, `guard`/`seo` → `registry:file` ; champs propres (`tokens`, `evidence`, `version`) dans `meta`.
- Validation CI avec `npx shadcn@<version épinglée> registry validate`.
- CLI maison sans dépendance qui **consomme le même JSON** et apporte ce que shadcn ne fait pas (`create`, `diff` 3-way, mode lié).

Avantages : schéma dans l'éditeur, validation gratuite, `shadcn add` possible depuis un futur site React. Inconvénient : la CLI shadcn suppose `components.json` et des alias orientés React ; tester qu'un item Astro (`registry:file` avec `target` explicite) s'installe proprement, sinon se limiter à la validation.

**CLI maison :** `node:util parseArgs` et FS injecté sont un excellent choix (testabilité, zéro dépendance, surface d'attaque minimale). Ajouter un `pp-ds.lock.json` côté consommateur (version, sha256 par fichier), `diff` en 3-way (base verrouillée, local, amont), `update` sur `git merge-file`, et `--dry-run` sur toutes les commandes qui écrivent.

### 4.6 Composants Astro, tests et CSP

**Container API :** toujours `experimental_AstroContainer` en Astro 7.3.x ; la documentation prévient qu'elle est « sujette à des changements cassants, même dans des versions mineures ou correctifs ». Exemple : la 7.3.5 a introduit une régression (attributs `data-astro-source-*` dans la sortie sous Vitest), corrigée en 7.3.6. Donc : (1) un helper unique `renderComponent()` dans `design-system/test/` ; (2) des assertions DOM (`linkedom` ou `happy-dom`) plutôt que des snapshots de chaîne ; (3) Astro épinglé, mises à jour Dependabot validées par ce test.

**axe + Playwright :** matrice clair/sombre × bureau/mobile sur le styleguide, plus 1.4.12 et `reducedMotion`.

**CSP sur GitHub Pages :** pas d'en-têtes HTTP personnalisés, donc CSP en `<meta http-equiv>`, où `frame-ancestors` et `report-uri` sont ignorés. Le hash `sha256-…` du script d'init doit être **calculé au build** à partir du contenu exact, avec un test qui recalcule et compare. Vérifier si la CSP intégrée d'Astro est stable en v7 avant d'écrire un intégrateur maison.

### 4.7 Limites de taille et `variants()`

- **≤ 60 lignes par composant :** bon pour les primitives, contre-productif pour Dialog, Select, Table ou Field (i18n, ARIA, états). Préférer la décomposition (`Dialog`, `DialogTitle`, `DialogActions`) à la compression ; dérogation écrite dans `meta.sizeException`, sinon on obtient du code-golf.
- **`variants()` maison :** défendable, car Astro dispose de `class:list` et le besoin se limite à variantes, défauts, variantes composées et types inférés. Risques : la typographie des variantes composées et l'absence de `tailwind-merge` (conflits si l'on accepte `class`). Règle : `class` accepté pour le placement seulement, `check-design` interdit les utilitaires de couleur et de typo externes ; test de types (`expectTypeOf`).

### 4.8 Starter et job CI

Le job « générer → installer → `verify` » est la bonne preuve. Ajouter : (1) un snapshot de l'**arborescence** et des hash générés, test rapide sans `npm install` ; (2) le job complet seulement si `design-system/**` change (filtre `paths`) ; (3) `npm ci --ignore-scripts` puis `npm audit signatures` dans le site généré ; (4) un cache npm. `create` produit le site et le test le compare au snapshot attendu.

### 4.9 Ce qui manque au plan

- **Versionnage :** release-please en mode monorepo, paquet `design-system` à tags `ds-vX.Y.Z` avec son CHANGELOG ; `meta.version` par item.
- **Migrations :** `design-system/migrations/X.Y.Z.md` par changement cassant de token, lu par `update`.
- **Gouvernance des tokens :** primitif libre, rôle sémantique par ADR, suppression en version majeure ; `check:tokens` refuse les tokens inutilisés.
- **Régression visuelle :** `toHaveScreenshot` de Playwright sur le styleguide, dans le conteneur Docker du dépôt.
- **i18n / RTL :** propriétés logiques uniquement dans les primitives, avec règle de lint.
- **Impression :** test PDF Playwright de la page CV.
- **Polices :** woff2 variable auto-hébergé ; sous-ensemble latin + latin-ext couvrant œ, « », U+202F ; `font-display: swap` ; préchargement de la graisse du corps ; métriques de repli (`size-adjust`, `ascent-override`) contre le CLS.
- **Licence OFL :** livrer `OFL.txt` ; vérifier un éventuel *Reserved Font Name*, qui pourrait imposer de renommer un sous-ensemble modifié.
- **Hygiène :** supprimer `.angular/cache` et le topic « angular », harmoniser l'intitulé du poste.
- **ADR-0007 :** le plan saute de 0006 à 0008 ; écrire « design system en brique indépendante » **avant** l'identité.

### 4.10 Sur-ingénierie et ordre de priorité

| Priorité | Contenu | Pourquoi |
|---|---|---|
| P0 | Hygiène, ADR-0007, tokens DTCG, générateur, contraste OKLCH, thème et `color-scheme`, garde-fous | Tout en dépend ; corrige les couplages |
| P1 | Identité (ADR-0008), primitives Every Layout, tier 1, styleguide, axe et e2e | Valeur visible immédiate |
| P2 | Registre au schéma shadcn, CLI `list`/`add`/`init` | Réutilisation |
| P3 | `create`, starter, job CI | Utile au deuxième site |
| P4 | `diff`/`update` 3-way, tier 2, view transitions, P3 | Confort |

## 5. Plan d'exécution pour Claude Code (Opus orchestre, Sonnet exécute)

### 5.1 Règles d'orchestration

- **CLAUDE.md** (déjà présent) : ajouter une section « Design system » (couches, limites, règle prouvé/convention/préférence, commande de vérification par brique) ; créer `design-system/CLAUDE.md` pour le contexte local.
- **Sous-agents dans `.claude/agents/`** (frontmatter `name`, `description`, `tools`, `model`) : `ds-tokens`, `ds-component`, `ds-guard`, `ds-docs` (Sonnet) ; `ds-reviewer` (outils en lecture seule et exécution de tests) ; `ds-evidence` (Sonnet, WebFetch, citation exacte obligatoire).
- **Worktrees isolés :** un worktree et une branche par tâche parallèle (`git worktree add ../pp-T3.4 -b ds/T3.4`) ; l'orchestrateur fusionne.
- **Propriété exclusive des fichiers :** chaque tâche déclare `files:` et deux tâches parallèles ne partagent aucun fichier. Les fichiers partagés (`registry.json`, `docs/test-matrix.md`, `design-system/src/index.ts`) sont **réservés à l'orchestrateur**, qui les fusionne à partir de fragments (`registry/items/<name>.json`).
- **Contexte minimal :** énoncé, chemins autorisés, critère d'acceptation, ADR pertinents, jamais l'historique de conversation.
- **Revue par un agent distinct :** `ds-reviewer` relit chaque PR (couches, limites, nombres magiques, a11y, preuves citées) sans pouvoir modifier le code.
- **Hooks :** `PostToolUse` sur l'écriture → `npm run lint -- <fichier>` ; commande d'acceptation obligatoire avant de clore une tâche.
- **Noms de modèles :** utiliser les identifiants exacts exposés par votre Claude Code pour « Opus 5.5 » et « Sonnet 5.5 », non vérifiés ici.

### 5.2 Épiques et tâches

Notation : **[S]** séquentiel, **[∥]** parallélisable, `→` dépendances.

**E0 — Hygiène et cadrage**
- T0.1 [S] Retirer `.angular/cache` et le topic « angular », harmoniser le README. Acceptation : `git ls-files .angular | wc -l` = 0 ; `npm run verify`.
- T0.2 [S] ADR-0007 « brique design-system ». Acceptation : `npm run check:docs`.
- T0.3 [S] `ds-evidence` : `docs/design-evidence.md` depuis la section 6, citations exactes et DOI. Acceptation : `check-docs` ; un niveau de preuve par ligne. **[VALIDATION PAUL]**

**E1 — Squelette** (→ E0)
- T1.0 [S] Figer `docs/browser-support.md` depuis webstatus.dev.
- T1.1 [S] `design-system/` : `package.json`, lockfile, tsconfig, eslint partagé, Vitest, README, CLAUDE.md. Acceptation : `npm --prefix design-system run verify`.
- T1.2 [S] Étendre `layers.mjs`, `knip.json`, `tsconfig`, `check-file-size` et la CI à `design-system/`. Acceptation : un fichier de 121 lignes fait échouer `check:size`.
- T1.3 [∥ après T1.1] Alias `@ds/*` et import CSS. Acceptation : `npm run build`.

**E2 — Fondations** (→ E1)
- T2.1 [S] Tokens DTCG et resolver light/dark (valeurs provisoires = palette actuelle). Acceptation : `npx terrazzo check design-system/tokens`.
- T2.2 [S] `lib/color.ts` : OKLCH → sRGB, test du gamut. Acceptation : `color.test.ts` avec vecteurs de CSS Color 4.
- T2.3 [S → T2.2] `lib/contrast.ts` sur OKLCH ; `contrast.test.ts` généré depuis la matrice des rôles (seuils de 1.8), deux thèmes. Acceptation : `vitest run contrast`.
- T2.4 [S] Générateur → `tokens.css`, `theme.css`, `tokens.d.ts` ; `check:tokens` (dérive, inutilisés, rapport APCA). Acceptation : un token modifié sans régénération fait échouer `npm run check:tokens`.
- T2.5 [∥ T2.4] `color-scheme`, bascule `data-theme`, script d'init avec hash CSP au build, `theme-color` double. Acceptation : e2e `theme.spec.ts`.
- T2.6 [∥] Typo (échelle fluide, mesure calibrée), espacement, tailles, rayons, filets, mouvement, z-index. Acceptation : `measure.spec.ts`, `motion.spec.ts`.
- T2.7 [∥] Polices : sous-ensemble, woff2, `font-face`, métriques de repli, OFL.txt. Acceptation : CLS ≤ seuil existant ; glyphes œ « » U+202F présents.
- T2.8 [S] Mettre à jour `design-rules.mjs`, `generate-og-image.mjs` et la skill favicon pour la source DTCG. Acceptation : `npm run check:design && npm run og`.

**E3 — Identité** (→ E2)
- T3.1 [S] Questionnaire (5 questions) → `docs/identity-brief.md`. **[VALIDATION PAUL]**
- T3.2 [S] ADR-0008 avec les trois directions, une page de démonstration par direction, contrastes calculés. **[VALIDATION PAUL]** : choix de la direction.
- T3.3 [S] Appliquer la direction : tokens, logo, monogramme, og-cover, favicons, `design-charter.md`, `design-charter.spec.ts`. Acceptation : `npm run verify && npm run e2e`.

**E4 — Primitives et lib** (→ E2 ; ∥ E3 possible sur valeurs provisoires)
- T4.1 [S] `variants()` avec test de types. Acceptation : `vitest run variants` et `tsc --noEmit`.
- T4.2 [S] Helper `renderComponent()`. Acceptation : test de fumée.
- T4.3–T4.8 [∥] Stack, Cluster, Grid, Container, Sidebar, Switcher : un agent et un worktree par primitive.

**E5 — Composants tier 1** (→ E4, E3.3)
- T5.x [∥ par lots de 3–4] Button, Input, Textarea, Select, Checkbox, Radio, Switch, Field, Alert, Separator, Progress/Meter, Accordion, Dialog (+ behavior closedby), Table, Breadcrumb, Prose, Status, Diff. Chaque tâche livre composant, test de rendu, exemple styleguide, fragment registre, doc, fragment test-matrix. Acceptation : `vitest run <nom>` et `npx playwright test styleguide --grep <nom>` (axe sans violation, 2 thèmes × 2 viewports).
- T5.y [S] Migration de `src/components/ui/*` vers `@ds/*` et règle check-design sur `sections/` et `pages/`. Acceptation : `npm run check:design`.

**E6 — Patterns** (→ E5) : Navbar, MobileMenu, ThemeToggle, LangSwitch, Footer (provenance), Hero, formulaire. [∥ par pattern] Acceptation : e2e existants plus focus non masqué (2.4.11). **[VALIDATION PAUL]** : revue visuelle du site complet.

**E7 — Registre et CLI** (→ E5)
- T7.1 [S] `registry.json` au schéma shadcn et fusion des fragments. Acceptation : `npx shadcn@<épinglé> registry validate ./design-system/registry.json`.
- T7.2 [∥] `list`, `init`, `add` (dépendances, refus d'écraser sans `--force`, `--dry-run`), FS en mémoire. Acceptation : `vitest run cli`.
- T7.3 [S] Lockfile et `diff` 3-way. Acceptation : test de conflit simulé.

**E8 — Starter** (→ E7)
- T8.1 [S] `create` : Astro, Tailwind, tokens, BaseLayout, init du thème avec hash CSP, i18n minimal, garde-fous, Husky/commitlint, CI minimale, sans Effect. Acceptation : snapshot d'arborescence.
- T8.2 [S] Job CI `starter` (filtre `paths`, cache) requis dans `ci`. Acceptation : run vert sur une PR de test.
- T8.3 [S] release-please monorepo (`ds-v*`) et migrations. Acceptation : `release-please --dry-run`.

### 5.3 Gabarits de prompts

**Tâche d'implémentation (Sonnet)**

```
Rôle : ds-component. Tâche T5.4 — Select.
Contexte : design-system/CLAUDE.md, docs/adr/0007*.md, docs/adr/0008*.md,
src/lib/variants.ts, src/primitives/Field.astro.
Fichiers autorisés (exclusifs) : src/primitives/Select.astro, test/Select.test.ts,
styleguide/select.astro, registry/items/select.json, docs/select.md, test-matrix/select.md
Contraintes : <select> natif, zéro JS, props typées, textes déjà traduits, ≤ 60 lignes
(sinon décompose + meta.sizeException), tokens --pp-* uniquement,
cible ≥ var(--pp-target-min), hauteur var(--pp-control-height).
Acceptation (coller la sortie) : npm --prefix design-system run verify ;
npx playwright test styleguide --grep select
Interdits : registry.json, index.ts, docs/test-matrix.md, nouvelle dépendance.
Livrable : diff + sorties + 3 lignes « ce qui reste incertain ».
```

**Revue (agent distinct)**

```
Rôle : ds-reviewer (lecture seule + tests). Branche ds/T5.4.
Vérifie : couches, limites, nombres magiques, tokens uniquement, a11y (label,
aria-invalid, focus 3:1), aucun texte en dur, propriétés logiques, test significatif.
Exécute l'acceptation. Réponds APPROUVÉ / CHANGEMENTS REQUIS + liste fichier:ligne.
```

**Vérification de source**

```
Rôle : ds-evidence. Source : <référence>. Ouvre la source primaire (DOI/W3C).
Rends : auteurs, année, revue, effectif, tâche, résultat en citation exacte, limites
déclarées, niveau (prouvé/soutenu/convention/préférence), décision de token SANS
extrapolation. Si introuvable : « non vérifié ».
```

## 6. Tableau corrigé « sources vérifiées et décisions »

| Sujet | Ce que la source établit | Décision | Niveau | Réserve |
|---|---|---|---|---|
| Police | Atkinson Hyperlegible (2019, Applied Design Works / Braille Institute, OFL) ; Next (10 février 2025 : 7 graisses, variable, 150+ langues) et Mono ; tests internes non publiés | Next auto-hébergée (sous-ensemble, woff2) ; Mono pour code et méta ; changement = ADR | Préférence argumentée | Aucune étude indépendante ; vérifier un éventuel Reserved Font Name |
| Polarité, petits textes | Piepenbrock et al. 2014 (*Human Factors*) : avantage du clair croissant quand la taille diminue ; 2013 (*Ergonomics*) : avantage chez jeunes et âgés | Clair = référence ; tailles minimales plus hautes en sombre | Prouvé (vision normale) | Cataracte non testée |
| Polarité, éclairage | Dobres et al. 2017 : pas d'effet de jour, avantage du clair de nuit | Corps minimal en sombre ≥ clair | Soutenu | Tâche de 1–2 mots |
| Bascule manuelle | Legge et al. 1985 : 7 participants à milieux troubles lisent mieux en sombre | Bascule obligatoire, mémorisée | Soutenu (sous-population) | Ancien, petit effectif |
| Suivre le système | Aucune étude | `color-scheme: light dark` par défaut | Convention | — |
| Myopie | Aleman et al. 2018 : 7 participants, choroïde −16,13 ± 4,54 µm (texte noir) / +9,96 ± 6,51 µm (texte blanc) en une heure | Aucune décision | Hypothèse | Marqueur de substitution |
| Longueur de ligne | Dyson & Haselgrove 2001 : 55 cpl ; Shaikh 2005 : 95 cpl le plus rapide ; Sahito 2015 : préférence 90 cpl | `--pp-measure` calibré pour ~60–75 caractères **mesurés** | Convention | `ch` ≠ caractère moyen ; effectif de Sahito non vérifié |
| Taille du corps | Rello et al. 2016 (104 participants) : progrès jusqu'à 18 pt | Corps fluide, minimum 18 px | Soutenu | Un site, un dispositif |
| Interligne | Rello 2016 : effets marginaux ; WCAG 1.4.12 | 1,5 par défaut ; e2e 1.4.12 | Norme (test), convention (valeur) | — |
| Polices « dyslexie » | Wery & Diliberto 2017 ; Kuster et al. 2018 : aucun bénéfice | Ne pas en proposer | Prouvé (absence d'effet) | Enfants |
| Cibles | WCAG 2.5.8 AA : 24 × 24 px ; 2.5.5 AAA : 44 × 44 px | `target-min` 24 bloquant ; `control-height` 44 par choix | Norme | Liens en ligne exemptés |
| Espace couleur | Ottosson 2020 (CAM16, IPT) ; Uchida 2026 (préprint) : STRESS 47,35 contre 29,13 | Source OKLCH, gamut sRGB testé, contraste en sRGB | Convention technique | « Approximativement uniforme » |
| Contraste normatif | WCAG 3.0 WD du 10 septembre 2026 : algorithme « à déterminer » | WCAG 2.2 bloquant ; APCA informatif | Norme | Recheck à chaque WD |
| Contraste interne | WCAG 1.4.6 AAA : 7:1 (4,5:1 grand texte) | 7:1 texte/fond ; 4,5:1 atténué, lien, sur accent ; 3:1 contrôles et focus | Choix (AAA partiel) | Ne pas revendiquer l'AAA |
| Focus | WCAG 2.4.7, 2.4.11 (AA), 2.4.13 (AAA : 2 px, 3:1) | Anneau ≥ 2 px, 3:1 testé, non masqué | Norme | — |
| Couleur seule | WCAG 1.4.1 | Statuts avec icône et libellé ; liens soulignés | Norme | — |
| Mouvement | WCAG 2.3.3 ; `prefers-reduced-motion` | Durées à 0 sous `reduce`, test e2e | Norme | 2.3.3 est AAA |
| Esthétique | Lindgaard 2006 (r ≈ 0,97) ; Tractinsky 2000 (132) ; Reinecke 2013 (548, 450 sites) | Palette restreinte, un point focal, structure prototypique | Soutenu (attrait perçu) | Ni confiance ni embauche |
| Mono | Aucune étude sur polices de code ; Rello & Baeza-Yates 2016 : Courier favorable en prose | Mono = fonction, pas la prose | Préférence | Aucune donnée sur le code |

## Caveats

- **Statuts navigateur :** plusieurs statuts du tableau 4.3 viennent de l'état connu du Baseline, pas d'une vérification faite ici ; la tâche T1.0 doit les figer. Seuls `closedby` (limité, Safari non pris en charge) et l'anchor positioning (Baseline Newly available, janvier 2026, date retenue d'après web.dev malgré une source secondaire divergente) ont été vérifiés.
- **Études non relues en source primaire :** Legge & Bigelow 2011, Chung 2004, Bernard et al., Tuch et al. 2012, et l'effectif de Sahito 2015. Les effectifs par étude de Lindgaard (22/31/40) proviennent du tableau de Tuch et al.
- **Préprint :** Uchida 2026 n'est pas revu par les pairs ; il confirme une limite connue d'Oklab sans être définitif.
- **Directions d'identité :** propositions de design (préférence), à passer par les tests de contraste avant adoption.
- **Modèles :** « Opus 5.5 » et « Sonnet 5.5 » sont repris de la demande sans vérification ; le plan n'en dépend pas.
- **Dépôt :** inspecté au niveau du README et de l'arborescence racine. Les couplages internes cités (regex de `contrast.test.ts`, listes autorisées de `design-rules`) viennent du plan de Paul et sont à confirmer en T1.2.