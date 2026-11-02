---
name: encre-accessibilite
description: Revue d'accessibilité WCAG 2.2 AA d'un composant ou d'une page : sémantique, noms accessibles, clavier et focus, formulaires, liens, langue, mouvement. À charger pour relire ou écrire du balisage ; « revue a11y », « accessibilité Encre ».
---

# Encre : revue d'accessibilité

Issue : [#232](https://github.com/PaulPerigault/design-system/issues/232). Sources du dépôt : `AGENTS.md`
(`role="list"`, noms de `nav`), `docs/a11y/manual-checklist.md` (VoiceOver et TalkBack à la main). Hors
périmètre ici, déjà couverts : contraste et couleur (`encre-design`), cibles, reflow, zoom, mouvement
réduit (`encre-mobile`). Skill de méthode, pas une preuve : « prouvé » seulement avec une source (norme
WCAG, W3C) ; sinon « convention » ou « préférence ». Un outil automatique ne détecte qu'une partie des
obstacles : un score de 100 n'est pas une conformité.

## Surcharges Encre

- Niveau visé : WCAG 2.2 AA ; AAA seulement si le dépôt le dit (cibles de 44 px : préférence).
- Aucun outil installé ni lancé en ligne de commande distante ; contrôles du dépôt et lecture du rendu.
- Aucun attribut `style` en ligne (CSP) : états par `data-*` ou classe. Zéro JS par défaut : la
  sémantique native d'abord (`button`, `a`, `details`, `dialog`).
- Pas de lecteur d'écran dans la CI : la procédure manuelle fait foi. Une PR à la fois, aucun sous-agent.

## Comment l'utiliser

- Phrase de déclenchement : « revue a11y de `<fichier ou page>` » (ou `/encre-accessibilite`).
- Lire le balisage rendu (`apps/docs/dist`) et non seulement la source ; parcourir au clavier.
- Sortie : Bloquant, À corriger, Ce qui tient ; `fichier:ligne`, critère WCAG, correctif d'une ligne.

## Sémantique et structure

- Un seul `h1` par page ; niveaux sans saut (1.3.1, 2.4.6). Titre de page unique et parlant (2.4.2).
- Repères : `header`, `nav`, `main`, `footer` ; tout `nav` en double porte un `aria-label` (`AGENTS.md`).
- Liste stylée sans puces (`list-style: none`) : `role="list"` explicite (VoiceOver retire sinon la
  sémantique). Tableau de données : `caption` ou nom, `th` avec `scope`.
- Lien d'évitement vers `#contenu` en premier élément focusable (2.4.1) ; cible présente et focusable.
- Langue de la page `lang="fr"` (3.1.1) ; passage dans une autre langue : `lang` local (3.1.2).
- Première règle d'ARIA : pas d'ARIA si un élément natif existe. Pas de rôle qui contredit l'élément.

## Noms, rôles, valeurs (4.1.2)

- Tout contrôle a un nom : texte visible, `aria-label` ou `aria-labelledby` ; le nom accessible contient
  le texte visible (2.5.3).
- État exposé par attribut : `aria-expanded`, `aria-pressed`, `aria-current`, `disabled`. Jamais par la
  couleur ou la classe seule.
- Image porteuse de sens : `alt` factuel ; décorative : `alt=""`. Icône décorative près d'un texte :
  `aria-hidden="true"`. Graphique SVG : `role="img"` avec `title` et `desc`, plus tableau de données
  ou `figcaption` qui donne le fait (1.1.1).
- Lien : texte compréhensible hors contexte (2.4.4) ; pas de « cliquez ici » ; lien externe signalé.

## Clavier et focus

- Tout est atteignable et actionnable au clavier, sans piège (2.1.1, 2.1.2) ; aucune action réservée
  au glisser (2.5.7, alternative en bouton). Ordre de tabulation = ordre visuel (2.4.3).
- Focus visible partout (2.4.7), jamais retiré par `outline: none` sans équivalent ; non masqué par un
  en-tête collant ou un recouvrement (2.4.11, nouveau en 2.2).
- `dialog` : focus déplacé à l'ouverture, rendu à l'élément déclencheur à la fermeture, Échap ferme.
  Pas de `tabindex` positif ; `tabindex="0"` seulement sur une région défilante qui n'a pas de contrôle.
- Raccourcis à une touche : désactivables ou limités au focus (2.1.4).

## Formulaires et erreurs

- Étiquette visible liée par `for`/`id` ; l'aide et l'erreur reliées par `aria-describedby` (3.3.2).
- Erreur identifiée en texte, avec la correction proposée (3.3.1, 3.3.3) ; plusieurs erreurs : résumé
  lié, focus dessus après envoi. L'erreur n'est pas portée par la couleur seule.
- `autocomplete` pour les champs de données personnelles (1.3.5). Ne pas redemander une donnée déjà
  saisie dans le parcours (3.3.7). Authentification sans test cognitif, collage autorisé (3.3.8).

## Mouvement et contenu qui change

- Contenu qui bouge plus de 5 s : pause, arrêt ou masquage (2.2.2). Rien ne clignote plus de 3 fois par
  seconde (2.3.1). Mouvement déclenché par l'interaction : désactivable (2.3.3, AAA, préférence).
- Messages d'état annoncés sans prendre le focus : `role="status"` ou `aria-live="polite"` (4.1.3).
- Changement de contexte jamais déclenché par une simple saisie ou un focus (3.2.1, 3.2.2).

## Ordre de gravité (convention)

| Gravité    | Exemples                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------- |
| Bloquant   | champ sans étiquette, image porteuse de sens sans `alt`, piège clavier, focus invisible   |
| À corriger | langue absente, saut de titre, lien non explicite, état seulement visuel, repère sans nom |
| À suivre   | ARIA superflu, ordre de lecture douteux, texte d'aide absent                              |

## Vérifier

1. Clavier seul : parcours complet, focus toujours visible et non masqué, aucun piège.
2. Rendu : titres, repères, noms des contrôles (arbre d'accessibilité du navigateur).
3. Zoom 200 % et 320 px : `encre-mobile`. Contraste : `encre-design`.
4. Lecteur d'écran, à la main sur le Mac de Paul : `docs/a11y/manual-checklist.md` (VoiceOver), à
   consigner au format de sa section 5. Ce qui n'est pas passé au lecteur d'écran est écrit « non testé ».

## Rapport

Bloquant, À corriger, Ce qui tient ; chaque ligne : `fichier:ligne`, critère, correctif. Les choix de
formulation (texte alternatif d'un graphique) : à Paul, avec une recommandation et `encre-voix`.

## Sources

Écrit le 2026-11-02, texte original à partir des critères de succès WCAG 2.2 (W3C, norme) ; structure
et ordre de gravité inspirés de `accessibility` de web-quality-skills (MIT, voir `PROVENANCE.md`).

| Source                                | URL                              | Niveau     |
| ------------------------------------- | -------------------------------- | ---------- |
| WCAG 2.2, critères de succès          | https://www.w3.org/TR/WCAG22/    | norme      |
| WAI-ARIA Authoring Practices (motifs) | https://www.w3.org/WAI/ARIA/apg/ | convention |

Les numéros de critères sont cités de mémoire de la norme : [À VÉRIFIER] contre la page W3C avant de
les écrire « prouvé » dans un texte public.
