# ADR-0009 — VoiceOver piloté à la main avec Guidepup, jamais en CI

- Statut : proposé (2026-11-02), choisi par l'orchestrateur en l'absence du propriétaire.
- Lié : `docs/a11y/manual-checklist.md`, gap.md n° 27, issues #110 et #246, D-134.

**En trois phrases.** La procédure manuelle écartait Guidepup parce qu'il ne tourne pas en CI ; cette ADR le reprend pour un usage local, lancé à la main sur le Mac de Paul. Un script parcourt les pages de la checklist avec VoiceOver et écrit le rapport au format de la section 5. Aucun job CI ne le lance, et il n'a pas été exécuté sur macOS.

## Contexte

La checklist écrit : « Cette procédure remplace l'automatisation Guidepup. Guidepup exige des réglages système et ne tourne pas en CI. » Le premier point est vrai, le second ne dit rien d'un usage local. Paul a un Mac : le parcours des pages et la mise en forme du rapport sont répétitifs et se génèrent, l'écoute et le jugement restent à lui.

Sources lues le 2026-11-02 :

- Dépôt Guidepup : licence MIT ; une seule API pour NVDA (Windows), Orca (Linux) et VoiceOver (macOS) ; paquet `@guidepup/guidepup`, version 0.40.0 sur npm (MIT, dépendances `debug`, `plist`, `dbus-native`, aucun script d'installation).
- Guide d'installation manuelle de Guidepup : cocher « Allow VoiceOver to be controlled with AppleScript » dans VoiceOver Utility (onglet Général) ; ajouter le terminal ou l'éditeur dans les réglages d'accessibilité ; d'autres autorisations (localisation, micro, enregistrement d'écran, automatisation) peuvent être demandées par une fenêtre. La voie « CI » du même guide exige de désactiver SIP : refusée.
- `npx @guidepup/setup setup` est présenté comme l'option préférée ; ce qu'il modifie n'est pas décrit sur les pages lues : `[À VÉRIFIER]`, donc non utilisé ici.

## Décision

- Guidepup reste **abandonné pour la CI** (SIP, réglages système, runner macOS payant en minutes).
- Il est **utilisable à la main** : `npm run a11y:voiceover` (macOS seulement, refus ailleurs), après les réglages du guide manuel et `npm -w @paulperigault/docs run preview`.
- Le script ouvre chaque page de la checklist dans Safari, avance de 120 éléments avec `voiceOver.next()` et lit `spokenPhraseLog()` ; il évalue des motifs (français et anglais) sur le texte prononcé et écrit `docs/a11y/results-AAAA-MM-JJ.md`.
- Un « conforme » du rapport n'est pas une écoute : c'est un motif trouvé. Un « écart » est à écouter. Ce qui n'a pas été prononcé est « non testé ».
- Partie pure testée (attentes, évaluation, rapport, pilotage avec un faux VoiceOver) ; partie qui pilote le vrai VoiceOver **non testée sur macOS**, écrite sous Windows. La navigation par repères et par rotor n'est pas utilisée : l'API pour la piloter n'a pas été lue (`[À VÉRIFIER]`).
- `@guidepup/guidepup` est une devDependency à version exacte (0.40.0), importée dynamiquement par le seul script.

## Conséquences

- La checklist garde sa place de référence ; le script prépare le rapport, il ne remplace ni l'écoute, ni TalkBack, ni NVDA (hors périmètre).
- Dépendances : 88 lignes de verrou en plus, `npm audit` identique (13 alertes modérées déjà présentes, aucune haute), aucun script d'installation.
- Premier lancement attendu de Paul : les réglages système, l'API de Guidepup et les motifs peuvent demander des ajustements.

## Alternatives écartées

- Guidepup en CI sur un runner macOS : SIP à désactiver, coût, et une CI qui modifie la sécurité du poste.
- Playwright et axe seuls : c'est déjà dans `apps/docs/e2e/` ; ils testent le balisage, pas ce que dit VoiceOver.
- `npx @guidepup/setup` : effets non lus.
