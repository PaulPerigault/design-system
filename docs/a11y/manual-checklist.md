# Procédure manuelle : VoiceOver et TalkBack

Cette procédure remplace l'automatisation Guidepup (gap.md n° 27). Guidepup exige des réglages
système et ne tourne pas en CI. Le propriétaire la suit à la main avant chaque lot qui touche un
composant interactif ou une page de navigation.

Les résultats se consignent dans `docs/a11y/results-AAAA-MM-JJ.md` (voir l'étape 5).

Légende des cases : [ ] à faire, [x] conforme, [!] écart constaté (le noter dans le tableau).

## 1. Préparation

### 1.1 Lecteurs d'écran à utiliser

- [ ] macOS : VoiceOver avec Safari (dernière version stable)
- [ ] iOS : VoiceOver avec Safari
- [ ] Android : TalkBack avec Chrome (dernière version stable)

### 1.2 Activer et quitter

- [ ] macOS, activer ou quitter VoiceOver : Cmd+F5 (raccourci par défaut).
- [ ] iOS, activer : Réglages > Accessibilité > VoiceOver. Quitter : même chemin, désactiver.
- [ ] Android, activer : Réglages > Accessibilité > TalkBack. Quitter : même chemin, désactiver.
      Le chemin exact peut varier selon la version d'Android et la marque du téléphone : à vérifier.

### 1.3 Commandes de base

macOS (VoiceOver, touche VO = Ctrl+Option) :

- [ ] Lire l'élément suivant : VO+flèche droite ; précédent : VO+flèche gauche.
- [ ] Activer l'élément courant : VO+Espace.
- [ ] Ouvrir le rotor : VO+U. Il permet de passer d'un titre, d'un repère, d'un lien ou d'un champ
      à l'autre. Flèches haut et bas pour changer de catégorie.
- [ ] Tabulation : passe d'un contrôle à l'autre, comme dans un navigateur.

iOS (VoiceOver) :

- [ ] Élément suivant ou précédent : balayer vers la droite ou la gauche d'un doigt.
- [ ] Activer : double tapotement.
- [ ] Ouvrir le rotor : tourner deux doigts sur l'écran. Changer de catégorie : balayer vers le haut
      ou le bas d'un doigt, une fois le rotor ouvert.
- [ ] Défilement : balayer vers le haut ou le bas à deux doigts.

Android (TalkBack) :

- [ ] Élément suivant ou précédent : balayer vers la droite ou la gauche d'un doigt.
- [ ] Activer : double tapotement.
- [ ] Retour arrière : balayer vers le bas puis vers la gauche (geste global de TalkBack).
      Le geste exact dépend de la version de TalkBack : à vérifier.
- [ ] Menu de contexte TalkBack : balayer vers le bas puis vers la droite. Les réglages de
      navigation par titres ou repères s'y trouvent : à vérifier selon la version.

## 2. Pages à parcourir

Pour chaque page, parcourir le contenu en entier d'un seul tenant, puis répéter avec le rotor
(repères, titres, liens).

- [ ] `/`
- [ ] `/identite/`
- [ ] `/components/button/`
- [ ] `/components/dialog/`
- [ ] `/components/accordion/`
- [ ] `/components/select/`
- [ ] `/components/switch/`
- [ ] Menu mobile : ouvrir le menu depuis une page, puis suivre les liens qu'il contient.
      Sur le site, ce menu n'apparaît qu'en largeur étroite : tester sur iOS et Android, et sur
      macOS en réduisant la fenêtre.

## 3. Composants interactifs

Pour chaque composant, vérifier les quatre points : annonce, ordre de focus, fermeture, retour du
focus. Le tableau de l'étape 3.6 consigne le résultat par plateforme.

### 3.1 Dialog

- [ ] Annonce à l'ouverture : nom de la boîte de dialogue et rôle « dialogue » (ou « alerte » pour
      une alerte). Le focus part dans le dialogue.
- [ ] Ordre de focus : le focus reste dans le dialogue pendant toute la navigation (piège de focus).
- [ ] Fermeture : Échap sur macOS, geste retour sur Android. Sur iOS, un bouton de fermeture
      accessible doit exister : vérifier qu'il est annoncé avec son nom.
- [ ] Retour du focus : après fermeture, le focus revient sur le déclencheur.

### 3.2 Accordion

- [ ] Annonce du bouton : nom du panneau, état replié ou déplié (`aria-expanded`), rôle bouton.
- [ ] Ordre de focus : Tabulation parcourt les en-têtes dans l'ordre visuel, sans entrer dans les
      panneaux repliés.
- [ ] Activation : Espace ou Entrée sur macOS, double tapotement sur mobile, change l'état annoncé.
- [ ] Retour du focus : le focus reste sur l'en-tête activé.

### 3.3 Select

- [ ] Annonce du contrôle : nom du champ, rôle (liste déroulante ou combobox selon l'implémentation),
      valeur courante, état replié ou déplié.
- [ ] Ordre de focus : le focus suit les options à la navigation clavier ou au balayage.
- [ ] Fermeture : Échap ferme la liste sans changer la valeur ; le geste retour ferme aussi sur
      Android.
- [ ] Retour du focus : après choix ou fermeture, le focus revient sur le champ.

### 3.4 Switch

- [ ] Annonce : nom du bouton, rôle interrupteur (ou case à cocher à bascule), état activé ou désactivé.
- [ ] Ordre de focus : un seul arrêt sur le contrôle, pas de deuxième arrêt sur un libellé séparé.
- [ ] Changement d'état : l'état nouveau est annoncé après activation.
- [ ] Retour du focus : le focus reste sur le contrôle.

### 3.5 Menu mobile

- [ ] Ouverture : le bouton annonce son nom, son rôle et son état (replié ou déplié).
- [ ] Ordre de focus : à l'ouverture, le focus entre dans le menu ; les liens se parcourent
      dans l'ordre visuel.
- [ ] Fermeture : bouton de fermeture ou Échap sur macOS, geste retour sur Android. Le menu ne doit
      pas rester accessible une fois fermé.
- [ ] Retour du focus : après fermeture, le focus revient sur le bouton d'ouverture.

### 3.6 Tableau de résultats par composant

| Composant | Élément      | Attendu                                | Constaté | VO macOS | VO iOS | TalkBack |
| --------- | ------------ | -------------------------------------- | -------- | -------- | ------ | -------- |
| Dialog    | Annonce      | Nom, rôle dialogue                     |          |          |        |          |
| Dialog    | Focus        | Reste dans le dialogue                 |          |          |        |          |
| Dialog    | Fermeture    | Échap ou geste retour                  |          |          |        |          |
| Dialog    | Retour focus | Revient sur le déclencheur             |          |          |        |          |
| Accordion | Annonce      | Nom, état replié ou déplié             |          |          |        |          |
| Accordion | Focus        | Ordre visuel, en-têtes seulement       |          |          |        |          |
| Accordion | Activation   | État nouveau annoncé                   |          |          |        |          |
| Accordion | Retour focus | Reste sur l'en-tête                    |          |          |        |          |
| Select    | Annonce      | Nom, rôle, valeur, état                |          |          |        |          |
| Select    | Focus        | Suit les options                       |          |          |        |          |
| Select    | Fermeture    | Échap ou geste retour, valeur gardée   |          |          |        |          |
| Select    | Retour focus | Revient sur le champ                   |          |          |        |          |
| Switch    | Annonce      | Nom, rôle, état                        |          |          |        |          |
| Switch    | Focus        | Un seul arrêt                          |          |          |        |          |
| Switch    | Changement   | Nouvel état annoncé                    |          |          |        |          |
| Switch    | Retour focus | Reste sur le contrôle                  |          |          |        |          |
| Menu      | Annonce      | Nom, rôle, état                        |          |          |        |          |
| Menu      | Focus        | Entre dans le menu, ordre visuel       |          |          |        |          |
| Menu      | Fermeture    | Échap ou geste retour, plus accessible |          |          |        |          |
| Menu      | Retour focus | Revient sur le bouton d'ouverture      |          |          |        |          |

## 4. Points communs à toutes les pages

- [ ] Lien d'évitement : le premier arrêt de Tabulation ou de balayage mène à `main`.
- [ ] Repères : `header`, `footer` et `main` sont annoncés. Chaque `nav` porte un nom distinct
      (rotor, catégorie repères). Deux `nav` sans nom ne doivent pas coexister.
- [ ] Hiérarchie de titres : rotor, catégorie titres. Un seul `h1` par page ; les niveaux se suivent
      sans saut.
- [ ] Listes : chaque liste est annoncée comme liste avec son nombre d'éléments. Les listes stylées
      sans puces gardent leur sémantique (`role="list"`).
- [ ] Tableaux : chaque tableau annonce ses en-têtes de colonne et de ligne lors de la navigation
      cellule par cellule.
- [ ] Images : chaque image informative a un texte alternatif pertinent. Les images décoratives sont
      ignorées par le lecteur.
- [ ] Liens et boutons : un nom explicite, pas de « cliquez ici » ni de nom vide.
- [ ] Zoom : la page reste utilisable à 200 % (macOS : Cmd+plus dans Safari ; iOS et Android : taille
      du texte dans les réglages d'affichage).

## 5. Consigner les résultats

Créer `docs/a11y/results-AAAA-MM-JJ.md` à la date du test, avec ce modèle :

```markdown
# Résultats VoiceOver et TalkBack : AAAA-MM-JJ

Version du système, du navigateur et du lecteur d'écran pour chaque plateforme :

- macOS : version, Safari, VoiceOver
- iOS : version, Safari, VoiceOver
- Android : version, Chrome, TalkBack

Commit ou version testée :

## Résultats par page et par composant

| Page ou composant | Plateforme | Attendu | Constaté | Écart (oui ou non) |
| ----------------- | ---------- | ------- | -------- | ------------------ |
|                   |            |         |          |                    |

## Points communs

| Point | Plateforme | Résultat | Commentaire |
| ----- | ---------- | -------- | ----------- |
|       |            |          |             |

## Écarts à traiter

- Écart, page, plateforme, gravité, lien vers l'issue ou la tâche
```

Pour chaque écart, noter la plateforme et les étapes de reproduction. Ne pas résumer « ça marche »
sans avoir coché les cases correspondantes.

## 6. Limites de cette procédure

- Les versions de macOS, d'iOS, d'Android et des lecteurs d'écran changent souvent. Les chemins de
  réglages et certains gestes sont à vérifier sur la version testée.
- Un test manuel ne remplace pas un audit d'accessibilité complet par un expert, ni la validation
  WCAG 2.2 AA qui exige des tests avec de vraies personnes utilisatrices de technologies d'assistance.
