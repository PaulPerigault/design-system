# Référentiel (L11)

Base de référence de la phase 2 : ce que disent les normes, la science, les design systems
publiés et les grands sites, et l'écart avec le design system. Établi le 2026-10-21.

| Fichier                        | Contenu                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| [norms.md](norms.md)           | WCAG 2.2, WCAG 3 (brouillon), RGAA, EN 301 549, Acte européen : état et cible retenue |
| [science.md](science.md)       | Études vérifiées en source primaire, classées prouvé, convention, préférence          |
| [systems.md](systems.md)       | Design systems publiés : fondations, pages de documentation, outillage IA             |
| [panel.md](panel.md)           | Panel de 32 acteurs à fort trafic : publié **et** observé, jamais mélangés            |
| [observations/](observations/) | Mesures Playwright brutes (`observations.json`) et leur méthode                       |
| [gap.md](gap.md)               | Pratique → source → convergence → notre état → écart → décision : définit L12 à L14   |

## Règles de lecture

- **Publié** (design system, blog d'ingénierie, étude) et **observé** (mesure faite ici) sont
  toujours séparés, et datés.
- Une pratique observée est au mieux une **convention**, jamais une preuve. Une convergence entre
  sites observés **et** systèmes publiés compte pour une convention solide ; une divergence se
  tranche par la science et la norme.
- Ce qui sert l'engagement (défilement infini, lecture automatique, notifications, schémas
  trompeurs, consentement biaisé, publicité) est signalé et **écarté** : rien de cela ne sert un
  portfolio ni un design system.
- Là où un grand site s'écarte de WCAG ou du RGAA, la norme l'emporte. On copie des principes,
  jamais une identité, un logo ou une interface reconnaissable.

## Méthode d'observation

`tools/benchmark/observe.mjs` (Chromium, Playwright) : une page publique par acteur, sans
connexion ni compte, en **393 × 852** (mobile tactile, densité 3) puis **1440 × 900**.
`robots.txt` est lu avant toute visite (groupe `User-agent: *`, RFC 9309) ; une page refusée
n'est pas chargée, une page anti-robot (code 4xx, défi) arrête l'acteur, sans contournement.
Aucun clic hormis une tabulation pour le focus. Les pages de connexion forcée sont notées comme
telles, sans aller plus loin.

Mesures : part des cibles visibles ≥ 44 et ≥ 24 px (petit côté), taille et interligne du premier
paragraphe long, caractères par ligne, barre fixe en bas, en-tête collant, bouton de menu,
`viewport-fit=cover`, zoom bloqué, fond en mode sombre, indicateur de focus après une
tabulation, nombre de requêtes et poids des polices.

Limites : une seule page et un seul passage par acteur ; les mesures dépendent de la région
(France), des bannières de consentement et des tests A/B. Elles décrivent, elles ne notent pas.
Les Core Web Vitals réels par site (CrUX via PageSpeed Insights) n'ont pas pu être relevés : l'API
sans clé a répondu « quota dépassé » (HTTP 429) ; les chiffres agrégés du Web Almanac 2025 les
remplacent (`science.md`).
