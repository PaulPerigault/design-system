# Audit du site de documentation (2026-10-29)

Audit de `apps/docs` avant la refonte (#123, sous-issue #164). Mesures prises sur le build local du
2026-10-29 (`apps/docs/dist`) ; « convention » ou « préférence » quand aucune source ne l'établit.
Aucun test avec des visiteurs réels n'a été fait : voir « Ce que l'audit ne mesure pas ».

## Structure

- 76 pages HTML, 50 composants au sommaire (`apps/docs/src/navigation.ts`), 8 groupes.
- En-tête : 4 liens (Accueil, Identité, Composants, Recherche). Pied de page : 6 liens
  (Glossaire, Accessibilité, Déclaration d'accessibilité, Mentions légales, Confidentialité,
  Crédits).
- Hors de ces deux menus, aucun lien permanent vers : Utiliser, Preuves, Architecture,
  Décisions, Auteur, PWA. Ces pages ne sont atteintes que par les liens de l'accueil (section
  « Par où commencer » : Composants, Utiliser, Glossaire, Recherche) et par des renvois dans le
  texte (Décisions, Preuves, Architecture et Auteur, dans les paragraphes de l'accueil).

## Parcours d'un nouveau visiteur

Deux lecteurs : recruteur ou responsable technique (premier), développeur Astro (second)
(`.agents/product-marketing.md`).

1. **Accueil.** Le `h1` est « Design system ». La première phrase décrit la page (« Cette page
   résume le système… ») ; elle ne dit ni ce que le lecteur obtient ni pourquoi rester. Aucune
   démonstration visible : ni composant, ni graphique, ni exemple de rendu. L'installation n'est
   pas sur l'accueil, il faut ouvrir « Utiliser ».
2. **Utiliser.** Les paquets ne sont pas publiés : la page l'écrit (« Les commandes ci-dessous
   fonctionneront après la première publication »). Le visiteur ne peut donc rien essayer.
3. **Composants.** Un sommaire de 50 entrées par groupe. Chaque fiche a exemple, propriétés et
   accessibilité. Le visiteur qui cherche « un graphique » doit connaître les noms de composants ou
   passer par la recherche.
4. **Preuves et décisions.** Les chiffres de `/preuves/` viennent de `proofs.json`, mesuré le
   2026-10-23, avant les composants de visualisation : 31 composants annoncés pour 50 au sommaire.

## Points de blocage relevés

| Point                                               | Constat                                                                                                                                                                             | Où                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Pas de démonstration en tête de page                | aucun rendu de composant ni de graphique sur l'accueil                                                                                                                              | `index.astro`                       |
| Navigation principale pauvre                        | 4 liens ; Utiliser, Preuves, Architecture, Auteur absents                                                                                                                           | `DocsLayout.astro`                  |
| Installation introuvable depuis l'accueil           | un lien « Utiliser » parmi quatre, rien d'exécutable                                                                                                                                | `index.astro`, `utiliser.astro`     |
| Textes incohérents entre pages                      | « six paquets » (accueil, architecture) contre sept (`AGENTS.md`, README) ; « 13 projets » de Visuel (architecture) contre 3 (`VISUAL_PROJECTS`) ; « design système » dans un titre | `index.astro`, `architecture.astro` |
| Preuves périmées                                    | `proofs.json` du 2026-10-23 : 31 composants, 1 331 tests unitaires                                                                                                                  | `src/data/proofs.json`              |
| Apostrophes mêlées                                  | `'` (auteur, utiliser) et `’` (accueil, architecture, preuves)                                                                                                                      | pages                               |
| Aucune mise en avant de la visualisation de données | les graphiques ne sont atteints que par le sommaire des composants                                                                                                                  | navigation                          |
| Contact vide                                        | « contact : [à compléter par Paul] » sur la page auteur                                                                                                                             | `auteur.astro`                      |

## Mesures de poids (build du 2026-10-29)

| Page                   | HTML    | HTML gzip | CSS     | Scripts |
| ---------------------- | ------- | --------- | ------- | ------- |
| Accueil                | 15,2 ko | 3,5 ko    | 21,1 ko | 2       |
| Utiliser               | 16,0 ko | 3,6 ko    | 21,2 ko | 2       |
| Composants (sommaire)  | 18,2 ko | 2,9 ko    | 20,0 ko | 2       |
| Composant `button`     | 20,3 ko | 4,7 ko    | 25,2 ko | 2       |
| Composant `line-chart` | 41,0 ko | 7,4 ko    | 29,1 ko | 2       |
| Architecture           | 21,2 ko | 4,9 ko    | 22,6 ko | 2       |

Hors pages : index de recherche Pagefind 902 ko, images 4 581 ko (`dist`), polices 166 ko. Le
total de `dist` est de 9,7 Mo. Les chiffres ne sont pas comparés à un budget de page : le budget
bloquant par ressource relève de l'étape 10 (#102, ADR-0006 décision 5).

L'accessibilité est mesurée par les tests e2e (axe, WCAG 2.2 AA, deux thèmes, plusieurs
appareils, vert en CI au 2026-10-29). Les Core Web Vitals sont mesurés par `perf.spec.ts` sur
des budgets de convention (LCP 2 500 ms, INP 200 ms, CLS 0,1, 1 Ko de script gzip).

## Ce qui fonctionne (à conserver)

- Zéro JavaScript requis pour lire : les 2 scripts de l'accueil sont le repli des invocateurs
  (`InvokerFallback`) et l'enregistrement du service worker ; le contenu est du HTML statique.
- Lien « Aller au contenu », `main` unique, pied de page en `nav` nommé, pages courtes et sourcées.
- Chaque affirmation de la page auteur renvoie à un fichier ; une limite est dite (D-021).
- Identité « Encre » déjà posée dans les jetons (fond quasi blanc ou quasi noir, accent unique).

## Ce que l'audit ne mesure pas

- Les tests avec visiteurs extérieurs (au moins trois personnes, critère de #123) : étape
  manuelle, pas faite ici.
- Lighthouse et les Core Web Vitals sur appareil réel ; seuls les budgets des tests e2e existent.
- La lisibilité réelle des textes : aucun relevé de lecture.
