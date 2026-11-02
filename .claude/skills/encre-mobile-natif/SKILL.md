---
name: encre-mobile-natif
description: Correctifs de plateforme mobile en CSS et en balises meta : survol collant, hauteur 100vh, zoom des champs, délai de toucher, rebond de défilement, zones sûres, theme-color. À charger pour un viewport, un plein écran, un champ, un geste ; « ça marche dans Chrome, pas sur mon téléphone ».
---

# Encre : mobile, correctifs de plateforme

Issue : [#221](https://github.com/PaulPerigault/design-system/issues/221). Complète `encre-mobile`
(cibles, reflow, matrice d'appareils) : ici, la couche plateforme. Skill réécrit depuis une source
tierce (`PROVENANCE.md`) ; en cas d'écart, `AGENTS.md` gagne. Méthode, pas preuve : « prouvé »
seulement si une source l'établit, sinon « convention » ou « préférence ».

## Surcharges Encre

- Pas de phrase d'accueil imposée. Pas de JavaScript pour ces correctifs (zéro JS par défaut) : une
  déclaration CSS ou une balise `meta` suffit presque toujours.
- Jamais `user-scalable=no` ni `maximum-scale=1` (déjà interdit : `encre-mobile`, « Viewport et zoom »).
- Le retour tactile natif n'est retiré (`-webkit-tap-highlight-color`) que si un état `:active`
  équivalent existe : sinon le toucher n'a plus aucun retour (préférence).
- Aucune valeur brute : durées, tailles et couleurs en jetons `--pp-*`. Aucun `style` en ligne : la
  CSP du site l'ignore. Propriétés logiques (`inline`, `block`).
- Ne pas copier de `transform: scale()` de retour d'appui ni de flou : animations réduites à
  `transform` et `opacity`, jamais `transition: all`, `prefers-reduced-motion` respecté.
- Viewport du dépôt : `width=device-width, initial-scale=1`, « rien d'autre » (`encre-mobile`).
  `viewport-fit=cover` et `env(safe-area-inset-*)` sont un écart : proposés, jamais appliqués sans
  décision écrite (D-xxx), utiles à une application plein écran ou installée, pas à une page de lecture.
- Une PR à la fois, aucun sous-agent ; l'appareil réel reste la référence (voir fin de fichier).

## Comment l'utiliser

- Phrase de déclenchement : « mobile natif de `<fichier>` » (ou `/encre-mobile-natif`).
- Lire le CSS et le `head` avant de juger ; citer `fichier:ligne`.
- Sortie : trois lignes par correctif (symptôme, déclaration changée, ce qui demande un téléphone).

## Symptômes et correctifs

| Symptôme                                 | Correctif                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Survol qui reste après un toucher        | styles `:hover` dans `@media (hover: hover) and (pointer: fine)`          |
| Éclair gris au toucher                   | donner un `:active`, puis seulement retirer le halo natif                 |
| Hauteur fausse sous la barre d'adresse   | `100dvh` (coque d'application), `100svh` (première vue)                   |
| La page zoome en entrant dans un champ   | police des champs à 16 px au moins                                        |
| Toucher lent                             | `touch-action: manipulation` ; retour à l'appui, pas au relâchement       |
| Le défilement tire la page ou rafraîchit | `overscroll-behavior` (`none` sur la racine, `contain` dans un conteneur) |
| Contenu sous l'encoche                   | `viewport-fit=cover` et `env(safe-area-inset-*)`                          |
| Appui long qui sélectionne un bouton     | `user-select: none` sur les commandes seulement                           |
| Carrousel qui défile dans l'autre axe    | `touch-action: pan-y` (ou `scroll-snap`, sans geste en JS)                |
| Barre d'état d'une autre couleur         | un `theme-color` par `prefers-color-scheme`                               |

## Pourquoi, en bref

- **Survol collant.** Le toucher n'a pas de survol : le navigateur en simule un qui reste jusqu'au
  toucher suivant. Les deux conditions comptent : `hover: hover` (l'entrée principale survole) et
  `pointer: fine` (précise). L'appui passe par `:active`, valable pour toute entrée.
- **100vh.** C'est la hauteur barre d'adresse repliée ; au chargement, la barre est là et le bas
  déborde. `dvh` suit la barre (coque), `svh` reste stable (première vue). Ne pas utiliser `lvh`.
- **Zoom des champs.** Safari iOS zoome sous 16 px et ne revient pas. Corriger la taille de police,
  pas le zoom. Régler aussi le clavier : `inputmode`, `type="email"` ou `tel`, `autocapitalize`,
  `autocorrect`, `enterkeyhint`.
- **Délai de toucher.** Le double-toucher zoome ; `touch-action: manipulation` dit qu'il n'est pas
  voulu sur cet élément. Un retour visuel au relâchement paraît lent même à 0 ms.
- **Rebond.** `overscroll-behavior: contain` garde le rebond du conteneur sans bouger la page. Pas de
  `touchmove` avec `preventDefault()` : il bloque le défilement et rend l'écouteur non passif.
- **Zones sûres.** Sans `viewport-fit=cover`, les `env()` valent `0px`. Donner un repli :
  `env(safe-area-inset-bottom, 0px)`. Concerne en-têtes collés, barres du bas, feuilles.
- **Sélection.** `user-select: none` sur un contenu (adresse, numéro de commande) est un défaut ;
  sur un bouton, c'est correct. Jamais sur `body`.
- **Gestes.** `touch-action: none` seulement sur un élément qui gère tous les axes, sinon on ne peut
  plus défiler au-delà.
- **theme-color.** Une valeur par schéma, égale à la couleur du haut de page, non à la marque.

## Socle (page mobile)

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
```

Ajouter `viewport-fit=cover` seulement après décision (voir « Surcharges »).

```css
html {
  -webkit-text-size-adjust: 100%;
} /* pas de gonflement en paysage */
input,
textarea,
select {
  font-size: 1rem;
} /* 16 px au moins à la taille de base */
button,
a,
[role='button'] {
  touch-action: manipulation;
}
@media (hover: hover) and (pointer: fine) {
  /* tous les :hover ici */
}
```

`1rem` reste valable tant que la taille de base n'est pas réduite : le mesurer. Un
`theme-color` par schéma vient de la couleur d'en-tête du site (jeton, non valeur écrite ici).

## Interdits

| Jamais                                             | À la place                               |
| -------------------------------------------------- | ---------------------------------------- |
| `:hover` sans condition de capacité                | `(hover: hover) and (pointer: fine)`     |
| `100vh` pour un bas collé                          | `100dvh`                                 |
| Détection par agent utilisateur                    | `(hover)`, `(pointer)`, `env()`          |
| `env(safe-area-inset-*)` sans `viewport-fit=cover` | ajouter la balise, sinon la valeur est 0 |
| Déclarer corrigé d'après l'émulation du poste      | un appareil réel                         |

## L'appareil réel

Rien de ce qui précède ne se reproduit dans l'émulation du navigateur : survol collant, halo, barre
d'adresse, zoom des champs, rebond, zones sûres, clavier logiciel. Brancher le téléphone, ouvrir le
serveur local par l'adresse du poste ; iOS : Safari, menu Développement ; Android : `chrome://inspect`.
Dire, pour chaque correctif, ce qui est vérifié par le code et ce qui demande un téléphone. Le
projet mesure l'émulation (`encre-mobile`, matrice) : ce n'est pas une preuve sur appareil.

## Sources

Réécrit le 2026-11-02 depuis un texte sous licence MIT : voir `PROVENANCE.md` (URL, SHA, licence).
Comportements des navigateurs : à confirmer sur appareil, niveau « convention » tant qu'aucune
spécification (CSS Environment Variables, CSS Overscroll Behavior) n'a été relue pour ce skill.
