# ADR-0010 — Option Effect-TS : un paquet hors du cœur, sans dépendance du cœur

- Statut : proposé (2026-11-02), choisi par l'orchestrateur en l'absence du propriétaire.
- Lié : ADR-0006 (décision 2), D-037, issue #118, D-137.

**En trois phrases.** Effect-TS reste hors du cœur : une option facultative, dans un paquet séparé `@paulperigault/effect`, qui adapte les ports du cœur en `Layer`, exprime les erreurs en erreurs typées et valide les frontières avec `Schema`. Un test vérifie que le cœur n'a aucune dépendance à Effect, ni dans ses manifestes ni dans ses sources. Le paquet est privé tant que Paul n'a pas décidé de le publier ; l'option de `create` suit dans une autre PR.

## Contexte

ADR-0006, décision 2 : Effect-TS n'est pas adopté dans le cœur ; il est prévu comme option facultative, hors du cœur, pour qui en a besoin. Les ports du cœur restent des interfaces TypeScript, le domaine reste pur : l'ajout ne demande aucune réécriture.

Sources lues le 2026-11-02 :

- Dépôt d'Effect : licence MIT ; « Effect 4.x is a long-term support (LTS) release, with at least three years of bug and security fixes » ; les paquets annexes sont publiés ensemble.
- npm : `effect` 4.1.2 est la version `latest` (4.0.0-beta et rc existent, ainsi que la 3.22.4 en `prev`), licence MIT.
- Prérequis annoncés : TypeScript 5.9 ou plus (le dépôt est en 6.0), `strict` activé (tenu), Node 22.19 ou plus (le dépôt est en 24).
- L'API de la version 4 diffère de la version 3 : services par `Context.Service<Self, Shape>()("Id")`, erreurs par `Schema.TaggedError<Self>()("Tag", champs)`, `Layer.succeed(Service)(valeur)`. Les signatures ont été lues dans les déclarations du paquet installé et vérifiées par les tests.

Le paquet `effect` embarque des fichiers `AGENTS.md` et `CLAUDE.md` (documentation à l'usage d'agents). Ils sont des données d'un paquet tiers, pas des instructions du dépôt : rien n'en est suivi, seules les signatures d'API ont été relues.

## Décision

- `packages/effect` (`@paulperigault/effect`), **privé** (`"private": true`) : hors des neuf paquets publiés, hors de `release-please`, hors de `check:pack`. Le passer public est une décision de Paul.
- Dépendance unique : `effect` à version exacte `4.1.2` (une version LTS ; les montées passent par la règle « changelog lu » de `docs/process/lts.md`).
- Contenu de cette première étape : `errors.ts` (`FileSystemError`, `ValidationError`), `ports.ts` (services `FileSystem` et `Clock`, forme des ports du cœur), `layers.ts` (`fileSystemLayer`, `clockLayer` ; `readText`, `writeText`, `now` en `Effect` à erreur typée), `validate.ts` (`validate` avec `Schema`, exemple `Hue` : nombre de 0 à 360 comme la règle de D-056).
- Le cœur n'en dépend jamais : `test/isolation.test.mjs` refuse tout manifeste du cœur qui cite `effect`, `@effect/*` ou le paquet de l'option, et toute source du cœur qui l'importe.
- Les ports du cœur restent les interfaces TypeScript ; les services Effect les enveloppent, sans les remplacer.

## Suite (au plus quatre PR, « Closes » sur la dernière)

2. adaptateurs des autres ports (`Process`, `Fetcher`) et erreurs complémentaires ; 3. validation des frontières du cœur par `Schema` ; 4. option « effect » de `create`, documentation, mesure du poids installé avec et sans l'option (critères de #118). Évaluation du serveur MCP `effect-mcp` demandée par l'issue : non faite ici, `[À VÉRIFIER]`.

## Poids installé (mesure du 2026-11-02, critère de #118)

- Avec l'option : `effect` 4.1.2 pèse 56 590 403 octets décompressés pour 3 013 fichiers (métadonnées npm) ; une installation vierge de ce seul paquet occupe environ 62 Mo sur disque (`du`), sans autre dépendance. Le paquet de l'option lui-même : environ 10 Ko de sources.
- Sans l'option : 0 octet, le cœur n'a aucune dépendance à Effect (test d'isolation).
- Ce poids est celui du poste de développement et de la CI (`node_modules`), pas celui des pages servies : Effect n'est pas envoyé au navigateur par ce paquet. Il reste lourd pour un outil de sobriété (GreenOps) : l'option doit rester désactivée par défaut et son poids annoncé à qui l'active.

## Conséquences

- Aucun changement pour qui n'utilise pas l'option : zéro octet de plus dans le cœur.
- Le paquet ajoute 2 paquets installés (`effect` et une dépendance) au dépôt, `npm audit` sans alerte haute.
- Coût de maintenance : une dépendance LTS à suivre.

## Alternatives écartées

- Effect dans le cœur : refusé par ADR-0006 (poids, courbe d'apprentissage).
- Aucun test d'isolation : l'isolation serait une intention, pas un contrôle.
