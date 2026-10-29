# Références de la régression visuelle

Le workflow Visuel (`.github/workflows/visual.yml`) compare des captures pleine page aux références
Linux versionnées dans `apps/docs/e2e/references/<projet>/<page>-<thème>.png`.

## Pourquoi « A snapshot doesn't exist » apparaissait

Les références n'étaient pas versionnées (`.visual/`, ignoré par git) et ne pouvaient pas l'être :
les polices et l'anticrénelage dépendent du système, donc une référence créée sous Windows échoue sous
Linux. Sur un runner neuf, aucune référence n'existait : Playwright écrit la capture et fait échouer le
test. Les références sont maintenant produites une fois par le runner Linux et committées.

## Périmètre (et poids)

- **Appareils** (`VISUAL_PROJECTS`, `apps/docs/e2e/devices.ts`) : 360x800, 820x1180, 1440x900. Un par
  largeur de conteneur distincte (seuils de 27 rem et 36 rem, page plafonnée). Écartés : les autres
  téléphones (même cas que 360), le paysage (même mise en page que 820) et le mouvement réduit
  (captures prises animations coupées, donc identiques).
- **Pages** : les 45 composants en thème clair ; les 7 gabarits (`TEMPLATE_PAGES`) et 7 composants
  (un par famille) dans les deux thèmes. Les pages de texte seul (mentions, crédits, glossaire,
  décisions détaillées) ne sont pas capturées : leur rendu est celui du gabarit `decisions`.
- **Densité 1** : une référence pèse neuf fois moins qu'à 3. Mesure : 660 captures (13 appareils,
  tout en double thème) = 157 Mo, trop lourd pour l'historique git ; le périmètre ci-dessus donne
  198 captures, 48 Mo.

Exception : les pages components/area-chart et components/gauge-chart ne sont capturées que de « Exemples » à « Variantes » (EXAMPLES_ONLY, pps/docs/e2e/matrix/visual.spec.ts) : leurs hachures dépassaient le budget de 600 Ko en pleine page.

## Quand la comparaison est exécutée

Le job `visuel` de `ci` appelle le workflow sur les PR qui touchent le rendu (même filtre que e2e :
`packages/css|tokens|astro`, `apps/`, dépendances de rendu) ; il est requis par le job agrégé `ci`.
Il ne tourne ni sur un push ni sur une PR de documentation. Le workflow tourne aussi chaque lundi
(05:00 UTC) et à la demande.

## Régénérer les références (changement de rendu voulu)

1. Pousser la branche, puis `gh workflow run visual.yml --ref <branche> -f update=true`.
2. Attendre la fin, puis `gh run download <id> -n visuel-references -D <dossier vide>`.
3. Supprimer `apps/docs/e2e/references/`, y copier le contenu téléchargé (un fichier qui ne change
   pas reste identique octet à octet : seuls les écarts apparaissent dans le diff).
4. Relire les images modifiées dans le diff de la PR, committer, pousser : le job `visuel` compare.

Un écart signalé sur une PR : télécharger l'artefact `visuel-differences` (`actual`, `expected`, `diff`).
Si l'écart est voulu, appliquer la procédure ci-dessus ; sinon corriger le rendu.
