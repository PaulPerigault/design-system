# Veille de skills tiers, novembre 2026

Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Décision : D-116 (règle de provenance, dans `encre-securite`). Consultation : 2026-11-02, par lecture de clones en quarantaine hors du dépôt, SHA épinglés ci-dessous.

## Méthode

- Clone `--depth 1` en lecture seule, hooks Git désactivés, dans un dossier de quarantaine du bloc-notes de la session (hors dépôt). Aucun `npx`, aucun `curl | sh`, aucun installeur, aucun script de candidat exécuté.
- Chaque fichier retenu est lu en entier ; les autres sont parcourus avec une recherche des signaux de la grille (`curl`, `wget`, `eval`, `base64`, `hook`, `allowed-tools`, télémétrie, « ignore tes règles », écriture hors du skill).
- Étoiles, dernière activité et licence : API publique GitHub (`gh api repos/<dépôt>`), le 2026-11-02. Un nombre d'étoiles mesure la popularité, pas la sûreté : niveau « mesure », sans valeur de preuve.
- Un verdict « retenu après modification » ne copie rien tel quel : le skill est réécrit au format `encre-*` avec `PROVENANCE.md` (règle D-116).

## Résultats

| Candidat                                                                                          | SHA lu     | Licence                        | Étoiles | Dernier push | Verdict                                           |
| ------------------------------------------------------------------------------------------------- | ---------- | ------------------------------ | ------- | ------------ | ------------------------------------------------- |
| [emilkowalski/skills](https://github.com/emilkowalski/skills)                                     | `f1090bec` | MIT (Emil Kowalski, 2026)      | 52 922  | 2026-11-02   | `break-ui`, `mobile-native` : retenus modifiés    |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable)                                       | `e89e3ada` | Apache-2.0 (+ `NOTICE.md`)     | 100 124 | 2026-11-02   | skill et détecteur : refusés ; méthode : retenue  |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)   | `3a13158f` | MIT (Next Level Builder, 2024) | 144 136 | 2026-11-01   | règles et liste de contrôle : retenues modifiées  |
| [obra/superpowers](https://github.com/obra/superpowers)                                           | `2ce8aa15` | MIT (Jesse Vincent, 2025)      | 311 024 | 2026-10-29   | refusé comme skill de projet ; idées notées       |
| [rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all) | `ba696b2c` | CC BY 4.0 (Eoghan Henn)        | 3 692   | 2026-10-28   | méthode retenue modifiée, sans hook ni dossier    |
| [nathankim0/clean-architecture-skills](https://github.com/nathankim0/clean-architecture-skills)   | `e27a49df` | MIT, titulaire absent          | 108     | 2026-10-23   | refusé (licence ambiguë) ; idées notées           |
| [softaworks/agent-toolkit](https://github.com/softaworks/agent-toolkit)                           | `3027f20f` | MIT (Leonardo Flores, 2026)    | 2 615   | 2026-03-05   | `c4-architecture` : retenu modifié ; reste refusé |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)               | `1da55aa8` | aucune                         | 15 675  | 2026-04-28   | refusé (licence absente) ; annuaire seulement     |

## emilkowalski/skills

Constats de la grille : aucune commande shell, aucun appel réseau, aucun hook, aucun `allowed-tools`, aucun script joint, aucune télémétrie. Seules occurrences : `npx expo install` (skills React Native, hors périmètre) et `npx skills@latest add` dans le `README` (installeur : non utilisé). Un fichier `.pl` vide à la racine. Les skills contiennent une « Initial Response » qui impose une phrase fixe : neutralisée dans la surcharge.

| Élément                                                                                                                                                                                    | Verdict                   | Raison                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `break-ui` (+ `CATALOG.md`)                                                                                                                                                                | retenu après modification | Comble un manque : aucun skill `encre-*` ne dit comment éprouver un composant avec des données pires. Le bascule « Demo data / Worst case » est remplacé par une fixture de test (aucun contrôle interactif dans un composant publié, zéro JS par défaut).                                                                      |
| `mobile-native`                                                                                                                                                                            | retenu après modification | Les correctifs de plateforme (survol collant, `dvh`, zoom des champs, `touch-action`, zones sûres, `theme-color`) ne sont pas dans `encre-mobile`, qui porte les cibles, le reflow et la matrice. `-webkit-tap-highlight-color: transparent` retiré : le dépôt garde le retour du navigateur tant qu'un `:active` n'existe pas. |
| `animation-performance`, `review-animations`                                                                                                                                               | refusés                   | Centrés sur React et la bibliothèque `motion` ; conseillent `filter: blur()` pour masquer un fondu et des ressorts. Le dépôt interdit le flou décoratif et n'a pas de moteur d'animation. Trois règles gardées dans `encre-mobile-natif` : animer `transform` et `opacity`, jamais `transition: all`, `prefers-reduced-motion`. |
| `ui-cheatsheet`, `performance-cheatsheet`                                                                                                                                                  | refusés                   | Une page chacune ; conseillent un flou pendant une transition et un dégradé adouci. Les lignes utiles (`tabular-nums`, `Intl.PluralRules`, `ch`) sont déjà dans `encre-design` ou dans `break-ui`.                                                                                                                              |
| `pick-ui-library`                                                                                                                                                                          | écarté (consigne)         | Choisit une bibliothèque de composants : sans objet pour un design system qui livre les siens.                                                                                                                                                                                                                                  |
| `emil-design-eng`, `animate*`, `prototype`, `apple-design`, `write-swift`, `ask-sonner`, `find-animation-opportunities`, `improve-animations`, `remove-animations`, `animation-vocabulary` | non retenus               | Mouvement, React, Swift, une bibliothèque de notifications : hors du périmètre web statique. Parcourus par recherche des signaux de la grille, rien de rouge.                                                                                                                                                                   |

## pbakaus/impeccable

Dépôt de 4 443 fichiers (v4.8.0, moteur Rust 0.1.18). Constats de la grille, tous rouges pour une installation :

- `allowed-tools` : `Bash(npx impeccable *)` et le lanceur du skill ; le skill exige `impeccable context` à chaque session.
- Hooks : une commande `hooks` installe un hook d'édition (`.claude/settings.local.json`) ; les `README` demandent `impeccable install`. Interdit par la règle.
- Écritures hors du dossier du skill : `.impeccable/config.json`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/questions/` (fichiers d'état, journal de tirages).
- Réseau et télémétrie : `CLAUDE.md` du dépôt décrit un ping de choix (`--chosen`) et une API de tirage sur `impeccable.style`, avec en-tête `X-Impeccable-Client` ; désactivable par `DO_NOT_TRACK` ou `IMPECCABLE_NO_TELEMETRY`, mais non par défaut.
- Binaire : le détecteur (`impeccable detect`) est un exécutable de 18 à 22 Mo téléchargé depuis les publications GitHub (`engine-v0.1.18`). Le condensat SHA-256 attendu est dans le dépôt, et un fichier `.sha256` accompagne chaque binaire : même origine, donc une preuve d'intégrité du transfert, pas de provenance. Aucune attestation de build (`actions/attest-build-provenance`, Sigstore, SLSA) dans `release-engine.yml`.
- Ton impératif : « Finish the job. No hedging », ambition à « award-winning design director » ; contraire à « design avant code » et aux interdits anti-IA (le skill recommande flou, `backdrop-filter`, ombres et grain comme « matériaux »).

**Verdicts.** Skill : refusé. Détecteur : refusé (binaire sans provenance vérifiable ; la construction depuis les sources Rust demande une chaîne `cargo` et un audit des `crates/` : hors budget, ⚖️ dans `tmp/questions-paul.md` si Paul le veut). Aucune issue de mesure n'est ouverte. Méthode : le vocabulaire critique, audit, polish, harden, clarify et le « plancher de qualité » (`craft-floor.md`, 52 lignes, lu en entier) donnent la matière de `encre-rendu-ia` ; seuls les signes qui ne sont pas déjà dans `encre-design` sont gardés, réécrits, sous licence Apache-2.0 (copie de la licence, `NOTICE.md`, modifications mentionnées).

## nextlevelbuilder/ui-ux-pro-max-skill

Constats : dépôt de 40 638 lignes de code, trois copies identiques du skill (`.claude/`, `src/`, `cli/assets/`), un installeur `npm` (`cli/`), des scripts Python. Les scripts du skill principal (`core.py`, `design_system.py`, `search.py`) lisent des CSV locaux et écrivent un dossier `design-system/` (option `--persist`) : aucun réseau, aucun `subprocess`. Le skill voisin `design` appelle une API tierce (`api.atlascloud.ai`) pour générer des logos : refusé. Le `SKILL.md` ordonne l'installation de Python et l'exécution de scripts : neutralisé, aucun script n'est copié.

| Élément                                                                 | Verdict            | Raison                                                                                                                               |
| ----------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Règles UX (formulaires, états, retour, navigation), `ux-guidelines.csv` | retenues modifiées | 120 lignes de règles avec gravité : triées, seules celles du web statique restent, dans la liste de contrôle d'`encre-cas-limites`.  |
| Liste de contrôle avant livraison                                       | retenue modifiée   | Réécrite pour le web (la source vise iOS, Android, Flutter) : états, contraste dans les deux thèmes, clavier, erreurs de formulaire. |
| Texte résilient (longueur, traduction, taille de texte)                 | retenu modifié     | Fusionné avec `break-ui`.                                                                                                            |
| Motif « MASTER plus surcharges »                                        | déjà en place      | `AGENTS.md` porte la règle, les skills la précisent : la section « Surcharges Encre » reprend l'idée sans fichier `design-system/`.  |
| Catalogue de styles, palettes, polices, installeur CLI                  | refusés (consigne) | Le catalogue propose glassmorphism, néomorphisme et dégradés ; le dépôt les interdit. L'installeur exécute du code.                  |

## obra/superpowers

Constats : un hook `SessionStart` (`hooks/hooks.json`, lanceur `run-hook.cmd`), des serveurs et scripts de test, une « loi de fer » impérative (« NO FIXES WITHOUT ROOT CAUSE », « NO COMPLETION CLAIMS WITHOUT… »), un flux obligatoire (brainstorming puis plan). Aucun appel réseau dans les quatre skills examinés. Le plugin est déjà installé au niveau utilisateur chez Paul : le copier dans le projet le doublerait.

Verdict : refusé comme skill de projet. Idées notées, non copiées : preuve avant affirmation (`verification-before-completion`, 120 lignes lues : couverte par « Vérifier avant d'envoyer » d'`encre-processus` et par « Report outcomes faithfully »), cause racine avant correctif (`systematic-debugging`), forme d'un skill (`writing-skills`). Rien n'est ajouté.

## rebelytics/one-skill-to-rule-them-all

Constats : skill de 682 lignes (« Task Observer ») avec scripts shell (`session-start-scan.sh`, `skill-load.sh`, `new-observation.sh`), un dossier `skill-observations/` écrit dans l'espace de travail, un `plugin.json` et un fichier `marketplace.json`. Pas de réseau dans les scripts lus ; l'écriture continue d'observations et le balayage au démarrage de session sont refusés par la règle (pas de hook, pas de dossier d'observations dans le dépôt).

Verdict : méthode retenue modifiée, sous CC BY 4.0 (Eoghan Henn, https://rebelytics.com). Gardés : la liste de signaux (nouveau skill, amélioration, simplification) et le test de généralité d'une correction. Ils alimentent `encre-veille` et la règle d'`encre-processus` (corrections répétées de Paul). Propositions écrites dans `tmp/`, soumises à Paul, jamais appliquées seules.

## Les autres

- **nathankim0/clean-architecture-skills** : MIT, mais le texte de licence porte « Copyright (c) 2026 » sans titulaire : la copie du copyright demandée par la règle est impossible. Refusé. Le `CLAUDE.md` du dépôt (maintenance) contient des `curl` de purge de cache, hors skill. Les idées (règle de dépendance, composition root, doublures comme adaptateurs) sont déjà dans ADR-0006.
- **softaworks/agent-toolkit** : MIT (Leonardo Flores). une quarantaine de skills ; examinés : `c4-architecture` (295 lignes, aucun script, aucune commande), `mermaid-diagrams`, `skill-judge`, `humanizer`, `qa-test-planner` (deux scripts shell : refusé). Retenu modifié : la grille des niveaux C4 (contexte et conteneurs suffisent à la plupart des équipes) et les erreurs fréquentes, pour `encre-architecture`. Le reste ne comble aucun manque ou double `encre-voix`.
- **travisvn/awesome-claude-skills** : annuaire sans fichier de licence (champ `license` nul) : refusé, aucune ligne copiée. Sert de piste pour la veille permanente.

## Sources

| Source                                                                | URL                                                          | Consultée                                                             | Niveau              |
| --------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------- |
| Dépôts ci-dessus, lus aux SHA indiqués                                | URL de la table « Résultats »                                | 2026-11-02                                                            | lecture directe     |
| API GitHub, métadonnées des dépôts (étoiles, push, licence)           | https://docs.github.com/en/rest/repos/repos#get-a-repository | 2026-11-02                                                            | mesure, sans preuve |
| API GitHub, publications d'impeccable (`engine-v0.1.18`, 10 fichiers) | https://github.com/pbakaus/impeccable/releases               | 2026-11-02                                                            | lecture directe     |
| Texte de la licence CC BY 4.0                                         | https://creativecommons.org/licenses/by/4.0/                 | [À VÉRIFIER] non ouvert ; la copie du dépôt rebelytics lue à la place | convention          |
| Texte de la licence Apache-2.0, article 4 (redistribution)            | https://www.apache.org/licenses/LICENSE-2.0                  | [À VÉRIFIER] non ouvert ; la copie du dépôt impeccable lue à la place | norme               |
