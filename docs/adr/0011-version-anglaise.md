# ADR-0011 — Version anglaise de la documentation : options, périmètre et poids des références

- Statut : proposé (2026-11-05), préparation seulement. La décision revient à Paul ; aucun code n'est écrit tant qu'elle n'est pas prise.
- Lié : issue #245 (parente #123), D-141 (références Visuel), `docs/process/visual-references.md`, ADR-0008 (refonte du site), D-127 (liens externes).

**En trois phrases.** La documentation est en français seulement ; traduire un site qui bouge encore double le coût de chaque changement. Cette ADR compare trois façons de produire l'anglais, propose un périmètre (pages d'usage traduites, ADR et décisions laissées en français) et chiffre ce que coûterait la régression visuelle : une copie complète des références ajouterait 58,7 Mo à l'historique git, un échantillon 14,4 Mo. Rien n'est à faire avant que le site français soit stabilisé et relu (#123, #112).

## Contexte

Faits mesurés le 2026-11-05 sur `main` (`428bf6d`) :

- 74 fichiers `.astro` dans `apps/docs/src/pages` (51 pages de composants, le reste en pages de texte et routes techniques) et 10 ADR dans `docs/adr`. Volume de texte, balisage et exemples de code compris, donc surestimé : environ 18 700 mots pour les pages de composants, 6 100 pour les autres pages, 10 700 pour les ADR (`wc -w`).
- `<html lang="fr">` est écrit en dur dans `DocsLayout.astro` ; `astro.config` n'a aucune configuration `i18n` ; `sitemap.xml.ts` liste les pages par `import.meta.glob` sans notion de langue ; la recherche est Pagefind (`pagefind --site dist`), construite sur le site entier.
- Le contrôle d'orthotypographie (`tools/checks/check-typography.mjs`, règles de `typography-rules.json`) ne connaît que le français (espaces insécables avant `:`, `;`, `?`, `!`, `%`, guillemets français).
- Les paquets `@paulperigault/*` sont publiés en 0.1.0 (`npm view`, 2026-11-05) ; leurs README et descriptions sont en français.

## Options pour produire l'anglais

| Option              | Principe                                                                                              | Qualité                      | Alignement                                                                          | Coût de maintenance                               |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| A. À la main        | Paul (ou un relecteur) écrit chaque page en anglais                                                   | La plus haute, voix tenue    | Une page française modifiée oblige à modifier la page anglaise                      | Le plus élevé, en temps de Paul                   |
| B. Outil            | Traduction automatique au build ou en amont, sans retouche                                            | Variable, voix « générique » | Automatique, mais le texte change à chaque build si l'outil change                  | Faible en temps, risque sur la voix et les termes |
| C. Mixte (proposée) | Brouillon par outil, relu et corrigé à la main, puis figé dans le dépôt ; glossaire de termes imposés | Bonne si la relecture a lieu | Un fichier de suivi lie chaque page anglaise à la version française qu'elle traduit | Moyen : relire seulement ce qui a changé          |

Aucun coût en euros ou en minutes n'est annoncé : il dépend de l'outil et du temps de relecture, `[À VÉRIFIER]` après un essai sur une page. Les règles du dépôt interdisent d'envoyer un secret à un service tiers ; un outil externe ne recevrait que du texte public.

### Alignement des deux versions (option C)

Chaque page anglaise porte l'empreinte (SHA-256) du texte français qu'elle traduit. Un contrôle `check:i18n` compare l'empreinte courante à celle enregistrée : un écart signale « traduction périmée ». Il est d'abord informatif (comme `check:typography` à ses débuts), puis bloquant quand le compte est nul. Il vérifie aussi que chaque route française a son équivalent `/en/` et inversement. Ce contrôle est du code : il serait écrit dans une sous-issue, pas ici.

## Périmètre proposé

| Contenu                                                                               | Proposition                                                                                        | Raison                                                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Accueil, utiliser, identité, données, accessibilité, architecture, composants (liste) | Traduits                                                                                           | Ce que lit un lecteur qui veut utiliser le système                                                                             |
| 51 pages de composants                                                                | Traduites : prose, noms de propriétés et exemples de code inchangés                                | Les API (`--pp-*`, props) restent identiques dans les deux langues                                                             |
| Glossaire                                                                             | Traduit, avec une entrée par terme et la table terme français / terme anglais                      | Les liens de termes (`link-terms.mjs`) doivent pointer dans la bonne langue                                                    |
| ADR et journal des décisions                                                          | Restent en français, avec un lien depuis `/en/` et un bandeau « disponible en français seulement » | 10 700 mots de raisonnement daté : la traduction se périmerait à chaque ADR                                                    |
| Pages légales (mentions, confidentialité, déclaration d'accessibilité)                | Restent en français                                                                                | Obligations rattachées à un droit français ; une traduction non juridique n'a pas de valeur `[À VÉRIFIER auprès d'un juriste]` |
| Voix (ton, mots interdits de `encre-voix`)                                            | Règles propres à l'anglais, à écrire (liste des formules creuses anglaises)                        | Le skill actuel est écrit pour le français                                                                                     |
| `llms.txt`, paquets npm, README                                                       | Hors périmètre                                                                                     | Autre public, autre décision                                                                                                   |

## Mécanique du site (à confirmer à l'implémentation)

- **Routes** : `/en/` reprend l'arborescence française (`/en/components/stack/`). Le français reste à la racine, sans préfixe, pour ne casser aucune URL existante ni les liens du portfolio. Astro propose un routage `i18n` natif (`prefixDefaultLocale: false`) `[À VÉRIFIER dans la documentation d'Astro de la version installée]`.
- **`lang`** : `<html lang>` passe de la constante à la langue de la page ; `SITE_LANG` de `site.ts` devient une table par langue.
- **`hreflang`** : sur chaque page, `<link rel="alternate" hreflang="fr">`, `hreflang="en"` et `hreflang="x-default"` (français), réciproques. Une page sans équivalent (ADR, pages légales) n'émet que sa propre langue. Règle de réciprocité de Google : chaque page doit pointer vers l'autre et vers elle-même `[À VÉRIFIER : source Google Search Central, à lire]`.
- **Canonique et sitemap** : une canonique par langue ; deux sitemaps (`sitemap-fr.xml`, `sitemap-en.xml`) référencés par un index, avec `xhtml:link` d'alternance. `robots.txt` pointe vers l'index.
- **Recherche** : Pagefind sait filtrer par langue (`data-pagefind-filter`) `[À VÉRIFIER]` ; sinon un index par langue, ce qui double le poids des fichiers d'index.
- **Sélecteur de langue** : un lien (pas de JavaScript) vers la page équivalente ; `lang` et `hreflang` sur le lien ; `aria-label` traduit.
- **Open Graph** : `og.mjs` produit une image par page ; l'anglais en ajoute autant `[À VÉRIFIER : poids de `dist/og`]`.
- **Orthotypographie anglaise** : un second jeu de règles (`typography-rules.en.json`) : pas d'espace avant `: ; ? !`, guillemets droits ou courbes `“ ”` (choix à faire), apostrophe `’`, séparateur de milliers `,` et décimal `.`, unités collées ou non selon le style retenu (SI : espace entre nombre et unité). Le formatage des nombres des pages de données (`Intl`, locale `fr`) suit la langue de la page. La source de style (par exemple le guide de style d'un éditeur) reste à choisir `[À VÉRIFIER]`.
- **Tests en double** : les e2e parcourent `PAGES` (liste des pages construites) : en ajoutant `/en/...`, ils tournent deux fois. Mesure du coût en minutes de CI : `[À VÉRIFIER]` sur une branche d'essai, aucune estimation ici. `check:links` couvre `dist` entier, donc l'anglais sans changement ; `a11y.spec.ts` et `cross-links.spec.ts` dépendent de `PAGES`.

## Poids des références Visuel (calcul)

Source : `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(objectsize:disk) %(rest)'`, filtré sur `apps/docs/e2e/references`, doublons d'objets exclus par l'identifiant d'objet. Mo = 2^20 octets.

| Mesure (2026-11-05, `main`)                       | Valeur                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Objets PNG distincts dans l'historique            | 1 556                                                                            |
| Taille cumulée, non compressée (taille des blobs) | 405,5 Mo                                                                         |
| Taille cumulée dans le pack (`objectsize:disk`)   | 330,4 Mo                                                                         |
| `.git` entier du clone                            | 337 Mo (dont 102 Mo de blobs hors références, taille brute)                      |
| Commits qui touchent les références               | 26                                                                               |
| Références actuelles                              | 228 PNG, 58,7 Mo (76 par largeur : 360 : 17,5 Mo, 820 : 20,5 Mo, 1440 : 20,7 Mo) |

Lecture :

- L'historique des références pèse **330 Mo dans le pack** (405 Mo bruts). Le chiffre attendu de 312 Mo n'est **pas confirmé** : l'écart de 18 Mo vient probablement de références ajoutées depuis sa mesure, ou d'une méthode différente (octets compressés d'un pack après `git gc`) `[À VÉRIFIER]`. L'ordre de grandeur est le même.
- Le surcoût d'une régénération complète est **confirmé** : 228 captures, 58,7 Mo (61,6 millions d'octets, soit les 61 617 398 o de D-141, à 0,1 % près). Un PNG déjà compressé se delta mal : chaque régénération d'une page qui a changé ajoute le fichier entier (le pack pèse 81 % de la taille brute, `objectsize:disk`). 1 556 objets pour 228 références, soit 6,8 jeux complets accumulés en 26 commits.
- Moyenne par capture : 0,26 Mo (58,7 / 228) ; gabarits de page, deux thèmes : 0,16 Mo par capture en 360 px, 0,18 à 0,19 Mo en 820 et 1440 px.

### Surcoût d'une version anglaise

Le périmètre des captures est celui de `apps/docs/e2e/matrix/visual.spec.ts` : par largeur, 8 gabarits en deux thèmes (16 captures), 7 composants en deux thèmes (14), 38 composants en clair seul (38), soit 76 captures ; trois largeurs (360, 820, 1440) ; densité 1.

| Option de références anglaises                                      | Captures          | Ajout à l'historique | Chaque régénération ensuite                                     |
| ------------------------------------------------------------------- | ----------------- | -------------------- | --------------------------------------------------------------- |
| A. Copie complète (même périmètre que le français)                  | 76 × 3 = 228      | 58,7 Mo              | 58,7 Mo (EN seul), 117,4 Mo si FR et EN sont régénérés ensemble |
| B. Échantillon : 8 gabarits en deux thèmes + 7 composants en clair  | (16 + 7) × 3 = 69 | 14,4 Mo              | 14,4 Mo (EN seul)                                               |
| C. Aucune référence anglaise ; tests de structure et de débordement | 0                 | 0 Mo                 | 0 Mo                                                            |

Détail de B, mesuré sur les PNG actuels : 360 px, 2,5 Mo (gabarits, deux thèmes) + 1,8 Mo (7 composants, clair) ; 820 px, 3,0 + 2,1 ; 1440 px, 2,9 + 2,1 ; total 14,4 Mo. En ne comparant que 360 et 1440 px pendant les PR de rendu (D-141), la comparaison de B porte sur 46 captures (9,3 Mo de régénération sur ces deux largeurs).

Hypothèse : un texte anglais est plus court que le français de quelques pour cent en moyenne `[À VÉRIFIER sur une page traduite]`, donc des PNG de taille voisine. Les hauteurs de page changent, jamais les largeurs : les références anglaises sont de nouveaux fichiers, jamais des mises à jour des françaises.

Effet de la règle de D-141 : une PR de rendu compare 152 des 228 captures françaises ; avec A elle en comparerait 304 sur 456, avec B 198 sur 297 `[calcul : 152 + 2 × 23 ; 228 + 69]`. Le temps de CI supplémentaire n'est pas mesuré `[À VÉRIFIER]` (le job a un plafond de 45 minutes).

Moyens de ne pas gonfler l'historique, à évaluer plutôt qu'à adopter : stocker les références hors de l'historique (Git LFS ou artefact : D-141 a laissé l'historique existant lourd), ou ne régénérer qu'à la demande. Aucun n'est décidé ici.

## Décision proposée

1. Option **C (mixte)** pour produire l'anglais : brouillon par outil, relecture et correction à la main, figé dans le dépôt, empreinte de la source française pour détecter les traductions périmées.
2. Périmètre du tableau ci-dessus : pages d'usage, composants et glossaire traduits ; ADR, décisions et pages légales en français.
3. Routes `/en/`, français à la racine sans préfixe, `hreflang` réciproque, un sitemap par langue.
4. Références Visuel : option **B (échantillon)**, 14,4 Mo à l'historique, avec la comparaison complète des deux langues par des tests de structure (mêmes titres, même nombre de liens, aucun débordement horizontal à 320 px).
5. Calendrier : après la stabilisation du site français et les relectures #123 et #112. Cette ADR ne lance aucun travail.

## Conséquences

- Chaque modification d'une page française crée une dette de traduction visible (contrôle informatif), jamais un échec de CI avant que Paul le décide.
- Le jeu de règles d'orthotypographie double ; `check:typography` doit choisir ses règles par `lang`.
- Les liens internes de la version anglaise vers une ADR ou une page légale sortent de `/en/` : ils portent `hreflang="fr"` et `lang="fr"` sur le lien.
- Poids ajouté à l'historique : 14,4 Mo (B), irréversible sans réécriture d'historique, interdite par les règles du dépôt.

## Alternatives écartées

- Traduire aussi les ADR : 10 700 mots qui se périment à chaque décision ; un ADR est un journal daté, dont l'original français fait foi.
- Préfixer le français (`/fr/`) : casse les URL existantes et les liens entrants, sans gain.
- Détection de la langue du navigateur et redirection : la redirection cache les pages aux robots et surprend le lecteur ; le sélecteur explicite suffit.
- Copie complète des références (A) : 58,7 Mo pour des captures qui contrôlent surtout le même CSS que le français.
- Aucune référence anglaise ni test de structure : un débordement dû à un mot anglais plus long passerait inaperçu.
