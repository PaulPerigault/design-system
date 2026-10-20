# ADR-0002 — Identité visuelle « Encre », ancrée sur le favicon

- Statut : accepté (2026-10-20), choisi par l'orchestrateur en l'absence du propriétaire ;
  relecture demandée dans `docs/identity-review.md`
- Remplace, pour les sites consommateurs, la charte « CV d'abord » (portfolio, ADR-0006) sur les
  couleurs, la typographie, les formes, les filets et le mouvement. Seul le favicon est conservé.

## Contexte et ancre

Le favicon du portfolio est conservé à l'identique (empreintes sha256 vérifiées par test côté
portfolio). Ce qu'il dit, relevé dans `public/image/logo.svg` :

- **Couleur** : une encre quasi noire, `#14161c` = `oklch(0.2008 0.0124 270.7)`, légèrement
  bleutée, et du blanc. Aucune autre couleur, aucun dégradé, aucune ombre.
- **Forme** : un carré aux coins arrondis à 14 % (`rx` 28/200) et un « P » géométrique de forte
  graisse, boucle en demi-cercle, contre-forme par `evenodd`.
- **Esprit** : construit sur un module (fût et contre-forme de 26/200), monochrome, sobre :
  une pièce d'ingénierie, pas une illustration.

Le propriétaire est ingénieur DevSecOps & Cloud, alternant en école d'ingénieur : tout en IaC,
sécurité et RGPD par défaut, code en briques, décisions écrites et prouvées. Le rendu ne doit pas
« faire IA » (pas de dégradé, de flou, d'ombres décoratives, d'emoji, ni de terminal vert sur noir).

## Quatre directions, mesurées

Mêmes rôles et même matrice de contraste pour toutes (WCAG 2.2, sRGB rendu ; calcul du
2026-10-20, script d'exploration puis `@paulperigault/tokens`).

| Direction    | Idée                                    | Accent (clair / sombre)             | Accent sur fond (clair / sombre) | Gamut sRGB                          | Lien au favicon                                                |
| ------------ | --------------------------------------- | ----------------------------------- | -------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| A. Runbook   | document d'exploitation, neutres chauds | ambre `#875814` / `#eeba70`         | 5,87 / 10,13                     | oui                                 | faible : teinte chaude contre une encre froide                 |
| B. Blueprint | plan d'architecture, neutres froids     | bleu de plan `#005fad` / `#88c0f9`  | 6,29 / 9,31                      | **non** en clair (chroma à réduire) | moyen ; cliché « plan bleu »                                   |
| C. Signal    | neutres purs, un accent fort            | vermillon `#c12b09` / `#f68770`     | 5,55 / 7,35                      | oui                                 | faible : le favicon n'a pas de couleur vive                    |
| **D. Encre** | l'encre du favicon devient le système   | encre saturée `#3749c3` / `#9fb4f8` | **6,93 / 8,86**                  | oui                                 | **fort** : même teinte (270,7), fond sombre = encre du favicon |

## Décision : D, « Encre »

- **Couleur.** Neutres de teinte 270,7 (celle du favicon), chroma ≤ 0,022 ; un seul accent, la
  même teinte saturée (`oklch(0.47 0.19 270.7)` en clair, `oklch(0.78 0.1 270.7)` en sombre).
  Le fond sombre **est** l'encre du favicon. Statuts de pipeline (`passed`, `failed`,
  `degraded`, `running`) toujours avec icône et libellé (WCAG 1.4.1).
- **Contraste (bloquant, généré depuis `roles.json`)** : 7:1 texte/fond et texte/surface ;
  4,5:1 texte atténué, liens, texte sur accent, statuts ; 3:1 contrôles et anneau de focus.
  Atteint : texte 16,8:1 (clair) et 15,4:1 (sombre), accent 6,93:1 et 8,94:1. AAA **partiel**,
  jamais revendiqué comme conformité AAA.
- **Typographie.** Atkinson Hyperlegible Next (variable, OFL-1.1) pour tout le texte ; Atkinson
  Hyperlegible Mono (variable, OFL-1.1) **uniquement** pour le code, les identifiants, les
  empreintes et les métadonnées. Corps fluide, 18 px minimum (Rello et al. 2016 : soutenu),
  échelle 1,25, interligne 1,55 (convention, testé par WCAG 1.4.12). Métriques de repli
  calculées depuis `@capsizecss/metrics`.
- **Formes.** Rayons modestes, en écho au favicon : 4 px pour les contrôles, 8 px pour les
  surfaces et médias, 14 % réservé à la marque (logo, avatar). Filets d'un pixel ; anneau de
  focus 2 px plein, décalé de 2 px. Aucune ombre.
- **Mouvement.** Quasi nul : 100 et 160 ms, opacité et transformations seulement ; 0 sous
  `prefers-reduced-motion: reduce`.

## Interdits « anti-IA » : maintenus et levés

Maintenus : dégradés, ombres décoratives, flou, emoji, étiquettes en majuscules espacées,
numéros de section, pastilles de tags, palette Tailwind par défaut, valeurs arbitraires,
imagerie « hacker » (vert sur noir, scanlines, glitch, machine à écrire), phrases génériques.

Levés, avec motif :

1. **Police mono** : levée pour le code, les empreintes, les identifiants et les journaux.
   Motif fonctionnel : alignement et distinction 0/O, 1/l/I. Aucune étude ne l'établit pour le
   code (rapport §2) : c'est une **préférence**. Interdite pour la prose.
2. **Coins quasi droits (2 px)** : remplacés par 4 et 8 px, par cohérence avec les coins à 14 %
   du favicon. **Préférence**.

## Preuve et réserves

- « Prouvé » : rien dans ce choix ne l'est. Le contraste est une **norme** (WCAG 2.2) ; la
  sobriété et la prototypicalité sont **soutenues** pour l'attrait perçu (Reinecke et al. 2013,
  Tuch et al. 2012), sans lien démontré avec la confiance ou l'embauche ; la police est une
  **préférence argumentée** (aucune étude indépendante).
- Réversible : tout passe par `packages/tokens` ; les trois autres directions restent décrites
  dans `packages/tokens/src/directions/` et comparées sur la page `/identite/` de la doc.
